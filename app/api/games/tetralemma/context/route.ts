import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { challenge, ideaA, ideaB, position, side } = await req.json();

  let prompt = "";

  if (position === "flip") {
    const activeIdea = side === "A" ? ideaA : ideaB;
    const inactiveIdea = side === "A" ? ideaB : ideaA;
    prompt = `Challenge: "${challenge}"
Idea A: "${ideaA}"
Idea B: "${ideaB}"

Create a specific, vivid scenario where "${activeIdea}" clearly works — and explain with real reasoning WHY it works in this context and WHY "${inactiveIdea}" would fail or be the wrong approach here.

Return ONLY valid JSON with exactly 3-4 bullet points. Each bullet max 20 words. Be concrete and show genuine reasoning — not generic statements:
{"points": ["reason 1", "reason 2", "reason 3", "reason 4"]}`;
  }

  if (position === "both") {
    prompt = `Challenge: "${challenge}"
Idea A: "${ideaA}"
Idea B: "${ideaB}"

Create a surprising, specific scenario where BOTH "${ideaA}" AND "${ideaB}" are simultaneously valid and work well together. Show real reasoning for why each one applies here.

Return ONLY valid JSON with exactly 3-4 bullet points (max 20 words each):
{"points": ["reason 1", "reason 2", "reason 3", "reason 4"]}`;
  }

  if (position === "neither") {
    prompt = `Challenge: "${challenge}"
Idea A: "${ideaA}"
Idea B: "${ideaB}"

Create a specific scenario where NEITHER "${ideaA}" NOR "${ideaB}" is the right answer — a completely different approach is needed. Explain why both fail here and hint at what kind of third path might work.

Return ONLY valid JSON with exactly 3-4 bullet points (max 20 words each):
{"points": ["reason 1", "reason 2", "reason 3", "reason 4"]}`;
  }

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  try {
    const parsed = JSON.parse(clean);
    return Response.json({ context: JSON.stringify(parsed) });
  } catch {
    return Response.json({ context: raw });
  }
}
