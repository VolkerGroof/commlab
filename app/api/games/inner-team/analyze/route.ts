import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJson(raw: string) {
  return JSON.parse(raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim());
}

export async function POST(req: NextRequest) {
  const { troubleStatement, paragraphs } = await req.json();

  const numbered = (paragraphs as string[])
    .map((p: string, i: number) => `${i + 1}. "${p}"`)
    .join("\n");

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `You are an expert in Schulz von Thun's "Inneres Team" (Inner Team) model.

The person is working through this challenge:
"${troubleStatement}"

They wrote these inner thoughts (one per paragraph):
${numbered}

For each paragraph, identify the inner voice/team member speaking. Merge if two paragraphs express the same voice.
Return at most 8 voices.

For each voice provide:
- name: a clear character name in English (e.g. "The Doubter", "The Fighter", "The Protector", "The Realist")
- description: 1 sentence on this voice's perspective
- positiveIntent: what is this voice trying to protect or achieve? (1 sentence, starting with a verb: "Protects you from...", "Keeps you from...", "Ensures you...")
- paragraphIndex: index of the primary paragraph (0-based)

Return ONLY valid JSON:
{"voices":[{"name":"...","description":"...","positiveIntent":"...","paragraphIndex":0}]}`,
    }],
  });

  const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
  try {
    return NextResponse.json(parseJson(raw));
  } catch {
    return NextResponse.json({ error: "parse error", raw }, { status: 500 });
  }
}
