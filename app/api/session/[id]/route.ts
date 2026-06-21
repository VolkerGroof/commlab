import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession, createSession, mutate } from "@/lib/sessionStore";
import type { ParticipantAnalysis } from "@/lib/sessionStore";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJson(raw: string) {
  return JSON.parse(raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim());
}

// ── GET — poll session state ──────────────────────────────────────────────────
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(session);
}

// ── POST — actions ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  // create
  if (action === "create") {
    const existing = getSession(id);
    if (existing) return NextResponse.json(existing);
    return NextResponse.json(createSession(id, body.name));
  }

  // lock-solo
  if (action === "lock-solo") {
    const s = mutate(id, (s) => { s.soloLocked = true; });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // join
  if (action === "join") {
    const existing = getSession(id);
    if (existing?.soloLocked) {
      return NextResponse.json({ error: "solo-locked" }, { status: 403 });
    }
    const s = mutate(id, (s) => {
      if (!s.participants[body.name]) {
        s.participants[body.name] = { name: body.name, interpretation: "", done: false };
      }
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  // set-message — creator sets mode, message, optional situation fields
  if (action === "set-message") {
    const s = mutate(id, (s) => {
      s.message = body.message;
      s.mode = body.mode || "general";
      s.situationContext = body.situationContext || undefined;
      s.speakerName = body.speakerName || undefined;
      s.phase = "collecting";
      // Assign roles in situation mode
      if (s.mode === "situation" && s.speakerName) {
        for (const name of Object.keys(s.participants)) {
          s.participants[name].role = name === s.speakerName ? "speaker" : "listener";
        }
      }
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // submit
  if (action === "submit") {
    const session = getSession(id);
    if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

    mutate(id, (s) => {
      s.participants[body.name].interpretation = body.interpretation;
      s.participants[body.name].done = true;
    });

    const updated = getSession(id)!;
    const all = Object.values(updated.participants);
    const allDone = all.every((p) => p.done);

    if (!allDone) {
      mutate(id, (s) => { s.phase = "collecting"; });
      return NextResponse.json(getSession(id));
    }

    mutate(id, (s) => { s.phase = "analyzing"; });

    const analyses = await Promise.all(
      all.map(async (p) => {
        const analysis = await analyseInterpretation(
          updated.message,
          p.interpretation,
          p.role || "listener",
          updated.situationContext,
        );
        return { name: p.name, analysis };
      })
    );

    mutate(id, (s) => {
      for (const { name, analysis } of analyses) {
        s.participants[name].analysis = analysis;
      }
      s.phase = "results";
    });

    return NextResponse.json(getSession(id));
  }

  // questions
  if (action === "questions") {
    const session = getSession(id)!;
    const listeners = Object.values(session.participants).filter(p => p.role !== "speaker");
    const speaker = Object.values(session.participants).find(p => p.role === "speaker");

    const allInterpretations = listeners
      .map((p) => `${p.name}: "${p.interpretation}"`)
      .join("\n");

    const speakerNote = speaker
      ? `\n\nNote: ${speaker.name} was the original speaker and intended: "${speaker.interpretation}"`
      : "";

    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `You are an expert in Schulz von Thun's communication model.

Message: "${session.message}"${session.situationContext ? `\nContext: "${session.situationContext}"` : ""}

Team interpretations (listeners):
${allInterpretations}${speakerNote}

Write 4 clarifying questions the listeners could ask the original sender — one per ear:
- FACT: factual/neutral opener ("Just to clarify...")
- SELF-DISCLOSURE: warm, inviting ("I'd like to understand you better, may I ask...")
- RELATIONSHIP: listener shares how it landed first, then asks ("I noticed... and I felt... — is everything okay between us?")
- APPEAL: genuinely curious about expectations ("I'm curious — what would you like from us? Should we...?")

Return ONLY valid JSON:
{"fact":"<q>","self":"<q>","relationship":"<q>","appeal":"<q>"}`,
      }],
    });

    const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
    const questions = parseJson(raw);

    const s = mutate(id, (s) => {
      s.questions = questions;
      s.phase = "questions";
    });
    return NextResponse.json(s);
  }

  // restart
  if (action === "restart") {
    const oldSession = getSession(id);
    if (!oldSession) return NextResponse.json({ error: "not found" }, { status: 404 });

    const newId = Math.random().toString(36).slice(2, 10);
    const starterName = body.name as string;
    createSession(newId, starterName);

    mutate(newId, (s) => {
      for (const name of Object.keys(oldSession.participants)) {
        if (name !== starterName) {
          s.participants[name] = { name, interpretation: "", done: false };
        }
      }
    });

    mutate(id, (s) => { s.nextSessionId = newId; s.nextSessionStarter = starterName; });

    return NextResponse.json({ newSessionId: newId, session: getSession(newId) });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

// ── Analysis ──────────────────────────────────────────────────────────────────

async function analyseInterpretation(
  message: string,
  interpretation: string,
  role: "speaker" | "listener",
  context?: string,
): Promise<ParticipantAnalysis> {

  const contextLine = context ? `\nContext/situation: "${context}"` : "";

  const ANALYST = role === "speaker"
    ? `You are an expert in Schulz von Thun's Kommunikationsquadrat.
This analysis is for the SENDER of the message — what did they pack into it?

Message: "${message}"${contextLine}
What the speaker intended/meant: "${interpretation}"

Analyse what the SPEAKER packed into each ear when sending this message:
- FACT: What factual content did the speaker want to convey?
- SELF-DISCLOSURE: What of their own inner state or feelings did the speaker reveal (intentionally or not)?
- RELATIONSHIP: What signal about the relationship with the listener(s) did the speaker send?
- APPEAL: What did the speaker want from the listener(s) — what reaction or behaviour were they hoping for?

Set to 0% if no evidence. Sum = 100.
Return ONLY valid JSON:
{"fact":{"percent":<0-100>,"label":"Fact","insight":"<1 sentence>"},"self":{"percent":<0-100>,"label":"Self-disclosure","insight":"<1 sentence>"},"relationship":{"percent":<0-100>,"label":"Relationship","insight":"<1 sentence>"},"appeal":{"percent":<0-100>,"label":"Appeal","insight":"<1 sentence>"}}`

    : `You are an expert in Schulz von Thun's Kommunikationsquadrat.
Determine which ear the listener used based on their interpretation.

Message: "${message}"${contextLine}
Interpretation: "${interpretation}"

The 4 ears — critical distinction:
- FACT: registered factual/informational content
- SELF-DISCLOSURE: picked up sender's feelings/mood ("he seemed annoyed", "he gave no emotional context")
- RELATIONSHIP: heard a signal about how sender views THEM personally ("he doesn't like me")
- APPEAL: wondering what sender WANTS FROM THEM ("no idea what he expects from me")

Self-disclosure = sender's inner world. Appeal = what sender wants FROM the listener. Don't confuse them.
Don't artificially spread percentages. Set to 0% if no evidence. Sum = 100.

Return ONLY valid JSON:
{"fact":{"percent":<0-100>,"label":"Fact","insight":"<1 sentence>"},"self":{"percent":<0-100>,"label":"Self-disclosure","insight":"<1 sentence>"},"relationship":{"percent":<0-100>,"label":"Relationship","insight":"<1 sentence>"},"appeal":{"percent":<0-100>,"label":"Appeal","insight":"<1 sentence>"}}`;

  const JUDGE = (draft: string) => role === "speaker"
    ? `Judge this sender-perspective Schulz von Thun analysis. Correct if needed.
Message: "${message}" | Speaker's intent: "${interpretation}"
Draft: ${draft}
Rules: percentages reflect what the SPEAKER packed into each ear based on their stated intent. Set to 0% if no evidence. Sum = 100.
Return corrected JSON in same format.`

    : `Judge this Schulz von Thun analysis. Correct if needed.
Message: "${message}" | Interpretation: "${interpretation}"
Draft: ${draft}
Rules: percentages reflect ONLY what the listener's stated interpretation shows. Set to 0% if no evidence. Sum = 100.
Return corrected JSON in same format.`;

  const p1 = await client.messages.create({
    model: "claude-haiku-4-5-20251001", max_tokens: 600,
    messages: [{ role: "user", content: ANALYST }],
  });
  const raw1 = p1.content[0].type === "text" ? p1.content[0].text : "{}";

  const p2 = await client.messages.create({
    model: "claude-haiku-4-5-20251001", max_tokens: 600,
    messages: [{ role: "user", content: JUDGE(raw1) }],
  });
  const raw2 = p2.content[0].type === "text" ? p2.content[0].text : raw1;

  try { return parseJson(raw2); } catch { return parseJson(raw1); }
}
