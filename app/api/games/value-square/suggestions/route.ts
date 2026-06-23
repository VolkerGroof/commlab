import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { primaryValue } = await req.json();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `For the value "${primaryValue}", generate exactly 5 complementary counter-values (Schwesterwerte / sister virtues) for a Value Square (Wertequadrat) in the sense of Schulz von Thun. These should BALANCE and COMPLEMENT "${primaryValue}" — not its opposite, but healthy counterparts that, when held in healthy tension with "${primaryValue}", prevent either from becoming an excess. Detect the language of "${primaryValue}" and respond in that exact same language. If the value is English, respond in English. If German, respond in German. Return ONLY a valid JSON array of exactly 5 short value names (2–4 words each). Example for English: ["Generosity","Ease","Spontaneity","Trust","Openness"]`,
    }],
  });
  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  const values = JSON.parse(clean);
  return Response.json({ values });
}
