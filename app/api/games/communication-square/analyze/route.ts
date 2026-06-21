import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJson(raw: string) {
  const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}

const ANALYST_PROMPT = (message: string, interpretation: string) => `You are an expert in Schulz von Thun's communication model (Kommunikationsquadrat).

Your task: determine which "ear" the listener used, based on HOW THEY INTERPRETED the message.

Message received: "${message}"
How the listener understood it: "${interpretation}"

The 4 ears — and their critical distinction:
- FACT: listener registered factual/informational content (what happened, when, where)
- SELF-DISCLOSURE: listener picked up on the SENDER's feelings, mood, or inner state — e.g. "he seemed annoyed", "he didn't explain how he felt", "he gave no emotional context"
- RELATIONSHIP: listener heard a signal about how the SENDER views THEM personally — e.g. "he doesn't like me", "he doesn't respect me", "this feels like a rejection"
- APPEAL: listener is wondering what the SENDER WANTS or EXPECTS FROM THEM — e.g. "I don't know what he expects from me", "should I suggest something?", "what does he want me to do?"

Critical distinction — Self-disclosure vs Appeal:
- Self-disclosure = about the sender's inner world ("what is HE feeling?")
- Appeal = about what the sender wants from the listener ("what does HE want FROM ME?")
- "No idea what he expects from me" → APPEAL, not self-disclosure
- "He didn't explain how he felt" → SELF-DISCLOSURE
- These are often confused — be precise.

Important nuances:
- Even if a dominant ear is clear, the other ears often have small but real contributions. A listener who says "they don't like me" still partially registered the factual content (e.g. the meeting is cancelled) — that's a small Fact share.
- If the listener noted the absence of something (e.g. "he didn't explain himself"), that shows they were listening through the Self-disclosure ear even without explicit content.
- Don't artificially spread percentages — let one ear dominate if that's what happened. But don't force any ear to 0 if there's evidence of even partial activation.

Return ONLY valid JSON:
{
  "fact":         { "percent": <0-100>, "label": "Fact",             "insight": "<1 sentence>" },
  "self":         { "percent": <0-100>, "label": "Self-disclosure",  "insight": "<1 sentence>" },
  "relationship": { "percent": <0-100>, "label": "Relationship",     "insight": "<1 sentence>" },
  "appeal":       { "percent": <0-100>, "label": "Appeal",           "insight": "<1 sentence>" }
}
Percentages MUST sum to exactly 100.`;

const JUDGE_PROMPT = (message: string, interpretation: string, draft: string) => `You are a senior expert in Schulz von Thun's Kommunikationsquadrat acting as a quality judge.

Review this analysis and correct it if needed.

Message: "${message}"
Listener's interpretation: "${interpretation}"

Draft analysis:
${draft}

Check:
1. Do the percentages accurately reflect which ear(s) the LISTENER actually used — based strictly on their stated interpretation?
2. Is the dominant ear correct?
3. Are any ears set too high or too low given the evidence in the interpretation?
4. Do the insight sentences correctly describe what was heard (high %) or missed (low %)?
5. Do the percentages sum to exactly 100?

Critical rule: if the listener's interpretation contains ZERO evidence of an ear being active, set it to 0%. Do NOT assign small residual percentages (1–10%) just to avoid zeros. A 0% is correct and honest when there is no evidence. Only assign % where the interpretation actually shows that ear was used.

Return the corrected analysis as ONLY valid JSON (same format). If the draft is already accurate, return it unchanged:
{
  "fact":         { "percent": <0-100>, "label": "Fact",             "insight": "<1 sentence>" },
  "self":         { "percent": <0-100>, "label": "Self-disclosure",  "insight": "<1 sentence>" },
  "relationship": { "percent": <0-100>, "label": "Relationship",     "insight": "<1 sentence>" },
  "appeal":       { "percent": <0-100>, "label": "Appeal",           "insight": "<1 sentence>" }
}`;

export async function POST(req: NextRequest) {
  const { message, interpretation } = await req.json();

  // Pass 1 — Analyst
  const pass1 = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: ANALYST_PROMPT(message, interpretation) }],
  });

  const raw1 = pass1.content[0].type === "text" ? pass1.content[0].text : "{}";

  // Pass 2 — Judge
  const pass2 = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: JUDGE_PROMPT(message, interpretation, raw1) }],
  });

  const raw2 = pass2.content[0].type === "text" ? pass2.content[0].text : raw1;

  try {
    return NextResponse.json(parseJson(raw2));
  } catch {
    try {
      return NextResponse.json(parseJson(raw1)); // fall back to pass 1
    } catch {
      return NextResponse.json({ error: "parse error", raw2 }, { status: 500 });
    }
  }
}
