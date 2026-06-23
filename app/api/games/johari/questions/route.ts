import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { category } = await req.json();

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Generate exactly 5 yes/no questions for a Johari Window assessment in a work context.
Category: "${category}"

Rules:
- Each question starts with "Does [name]" — use the literal placeholder [name]
- Questions must be answerable with Yes or No
- Cover different facets of the category
- Be specific and behaviorally observable — not vague traits
- Professional and respectful tone

Return ONLY a valid JSON array of 5 strings:
["Does [name] ...", "Does [name] ...", "Does [name] ...", "Does [name] ...", "Does [name] ..."]`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  const questions = JSON.parse(clean);
  return Response.json({ questions });
}
