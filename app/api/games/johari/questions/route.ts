import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { category } = await req.json();

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Generate exactly 20 work-relevant personality and behavior traits for a Johari Window assessment.
Category: "${category}"

Rules:
- Short adjectives or 2-3 word phrases only (e.g. "decisive", "good listener", "creative")
- Specific to the category context
- Mix of strengths and areas for growth
- Neutral, non-judgmental phrasing
- No overlap or near-duplicates

Return ONLY a valid JSON array of exactly 20 strings:
["trait1", "trait2", ..., "trait20"]`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  const attributes = JSON.parse(clean);
  return Response.json({ attributes });
}
