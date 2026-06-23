import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJson(raw: string) {
  return JSON.parse(raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim());
}

export async function POST(req: NextRequest) {
  const { troubleStatement, voices } = await req.json();

  const voicePrompts = (voices as {
    name: string; description: string; positiveIntent: string; userMessage: string;
  }[]).map(v => `Voice: "${v.name}" (${v.description})
Positive intent: ${v.positiveIntent}
Person said to this voice: "${v.userMessage}"`).join("\n\n");

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `You are facilitating an inner team dialogue (Schulz von Thun's Inneres Team model).

Challenge the person is working through: "${troubleStatement}"

For each inner voice below, write a brief response (2–3 sentences) AS that voice, after hearing what the person said to it. The voice may feel heard and soften, affirm its message, or gently insist — always speaking from its positive protective intention. Write in first person as the voice.

${voicePrompts}

Return ONLY valid JSON:
{"revisedPositions":[{"name":"...","revisedPosition":"..."}]}`,
    }],
  });

  const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
  try {
    return NextResponse.json(parseJson(raw));
  } catch {
    return NextResponse.json({ error: "parse error", raw }, { status: 500 });
  }
}
