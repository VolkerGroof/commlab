import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { dimension, scores, participants } = await req.json() as {
    dimension: { name: string; leftLabel: string; rightLabel: string };
    scores: Record<string, number>;
    participants: string[];
  };

  const scoreList = participants.map(p => `${p}: ${scores[p] ?? "?"}/6`).join(", ");
  const spread = Math.max(...Object.values(scores)) - Math.min(...Object.values(scores));

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `You are a team coach. The team just assessed themselves on the dimension "${dimension.name}".
Scale: 1=${dimension.leftLabel} ↔ 6=${dimension.rightLabel}
Team scores: ${scoreList}
Score spread: ${spread} (${spread >= 3 ? "high diversity" : spread >= 2 ? "moderate diversity" : "good alignment"})

Generate 3 concrete, actionable team agreements. Each agreement MUST be maximum 1-2 short sentences. No lists, no sub-bullets. Direct and specific — something the team can do differently starting tomorrow.

Return ONLY valid JSON array of 3 short strings (each max 30 words):
["Short agreement 1", "Short agreement 2", "Short agreement 3"]`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  return Response.json({ agreements: JSON.parse(clean) });
}
