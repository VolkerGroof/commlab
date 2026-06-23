import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

// ── Exact traffic-light algorithm ─────────────────────────────────────────────

interface Pct { mover: number; follower: number; opposer: number; bystander: number }

function computeStatus(p: Pct): { status: "green"|"yellow"|"red"; rule: string; label: string; ruleDesc: string } {
  const { mover: M, follower: F, opposer: O, bystander: B } = p;

  // RED — checked first (fundamental dysfunction)
  if (O > 40 && F < 10)
    return { status: "red", rule: "R1", label: "Warfare Zone",
      ruleDesc: `Opposer (${O}%) overwhelms Follower (${F}%) — the meeting is blocked.` };
  if (M < 5)
    return { status: "red", rule: "R2", label: "No Leadership",
      ruleDesc: `Mover at only ${M}% — nobody is driving the conversation forward.` };
  if (M === 0 || F === 0 || O === 0) {
    const missing = [M===0&&"Mover", F===0&&"Follower", O===0&&"Opposer"].filter(Boolean).join(" & ");
    return { status: "red", rule: "R3", label: "Role Absent",
      ruleDesc: `${missing} at 0% — a core structural role is completely missing.` };
  }

  // YELLOW — structural imbalance
  if (M > 50)
    return { status: "yellow", rule: "G1", label: "Mover Dominance",
      ruleDesc: `Mover at ${M}% — one voice is driving everything, too little room for others.` };
  if (F > 50)
    return { status: "yellow", rule: "G1", label: "Follower Dominance",
      ruleDesc: `Follower at ${F}% — groupthink risk. Ideas are accepted without critical challenge.` };
  if (B > 30 && M < 15)
    return { status: "yellow", rule: "G2", label: "Analysis Paralysis",
      ruleDesc: `Bystander (${B}%) too high, Mover (${M}%) too low — observation without action.` };
  if (B === 0)
    return { status: "yellow", rule: "G3", label: "No Reflection",
      ruleDesc: `Bystander at 0% — the team is moving without anyone stepping back to reflect.` };

  // GREEN
  return { status: "green", rule: "—", label: "Healthy Dynamics",
    ruleDesc: `All four roles active and balanced. M=${M}% F=${F}% O=${O}% B=${B}%.` };
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM = `You are an expert meeting facilitator analyzing transcripts using David Kantor's Structural Dynamics / 4-Player Model.

Classify every speaking turn into one of these roles:
- MOVER: Initiates, proposes, directs, moves things forward
- FOLLOWER: Supports, agrees, builds on, enables movement
- OPPOSER: Challenges, questions, disagrees, corrects
- BYSTANDER: Observes, reflects, provides meta-view, contextualizes
- OTHER: Small talk, greetings, logistics, social pleasantries (not scored in balance)

Be precise. Count each turn independently.`;

const USER_PROMPT = `Analyze this meeting transcript using Kantor's 4-Player Model.

Return ONLY valid JSON (no markdown, no explanation outside the JSON):
{
  "summary": "2-3 sentence description of the session dynamics",
  "percentages": {
    "mover": <integer 0-100, % of SCORED turns (M+F+O+B only)>,
    "follower": <integer 0-100>,
    "opposer": <integer 0-100>,
    "bystander": <integer 0-100>,
    "other": <integer 0-100, % of ALL turns that were classified as OTHER>
  },
  "speakers": [
    {
      "name": "Speaker Name",
      "mover": <count of MOVER turns>,
      "follower": <count>,
      "opposer": <count>,
      "bystander": <count>,
      "other": <count>,
      "dominantRole": "MOVER" | "FOLLOWER" | "OPPOSER" | "BYSTANDER" | "OTHER"
    }
  ],
  "insights": [
    "Specific coaching insight 1 with concrete actionable recommendation",
    "Specific coaching insight 2",
    "Specific coaching insight 3"
  ]
}

The four percentages (mover+follower+opposer+bystander) must sum to 100.`;

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { content, isPdf } = body as { content: string; isPdf: boolean };

  let messageContent: Anthropic.MessageParam["content"];

  if (isPdf) {
    messageContent = [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: content } },
      { type: "text", text: USER_PROMPT },
    ];
  } else {
    messageContent = `${USER_PROMPT}\n\nTRANSCRIPT:\n\n${content}`;
  }

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: "user", content: messageContent }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  const claude = JSON.parse(clean);

  // Apply the deterministic algorithm server-side
  const { status, rule, label, ruleDesc } = computeStatus(claude.percentages);

  return Response.json({ ...claude, status, statusLabel: label, rule, ruleDesc });
}
