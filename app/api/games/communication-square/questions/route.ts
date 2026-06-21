import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { message, interpretation } = await req.json();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `You are an expert in Schulz von Thun's communication model.

Someone received this message: "${message}"
They interpreted it as: "${interpretation}"

Write 4 questions they could ask the sender to gently clarify what was really meant — one per ear. Each question must reflect the communication style of that ear:

- FACT question: Sound factual and neutral. Open with something like "Just to make sure I understood correctly..." or "Technically speaking..." — ask about the concrete situation, not feelings.
- SELF-DISCLOSURE question: Sound warm and inviting. Open with something like "I'd like to understand you better, may I ask..." or "I don't want to assume — how are you feeling about...?" — create space for the sender to share.
- RELATIONSHIP question: Include a brief self-disclosure from the listener FIRST (share how the message landed for them), then ask about the relationship. E.g. "I noticed your message was quite brief and I found myself wondering if something's off between us — is everything okay with us?"
- APPEAL question: Sound genuinely curious about what the sender expects or wishes from the listener. Ask about the expectation behind the message — what behaviour or response they're hoping for. E.g. "I'm curious — what would you like from me? Should I suggest another time, or is there something else you're hoping for?" The tone is open and non-pressuring, inviting the sender to name their wish.

Return ONLY valid JSON:
{
  "fact": "<question>",
  "self": "<question>",
  "relationship": "<question>",
  "appeal": "<question>"
}`,
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  const text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "parse error", raw }, { status: 500 });
  }
}
