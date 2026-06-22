import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { primaryValue, complementaryValue } = await req.json();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Create a Value Square (Wertequadrat) for these two complementary values:
- Primary value: "${primaryValue}"
- Complementary value: "${complementaryValue}"

Generate:
1. excessPrimary: What "${primaryValue}" becomes when overdone/exaggerated (1–3 words, negative connotation)
2. excessComplementary: What "${complementaryValue}" becomes when overdone/exaggerated (1–3 words, negative connotation)
3. direction1: One short encouraging sentence describing the development direction from excessPrimary toward more "${complementaryValue}"
4. direction2: One short encouraging sentence describing the development direction from excessComplementary toward more "${primaryValue}"

Respond in the SAME language as the input values. Return ONLY valid JSON:
{"excessPrimary":"...","excessComplementary":"...","direction1":"...","direction2":"..."}`,
    }],
  });
  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  const data = JSON.parse(clean);
  return Response.json(data);
}
