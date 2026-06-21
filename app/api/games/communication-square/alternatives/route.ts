import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `You are an expert in Schulz von Thun's communication model.
For this message: "${message}"

Generate one alternative interpretation for each of the 4 ears — how someone could reasonably hear this message differently.
Return ONLY valid JSON:

{
  "fact": "<1 sentence: an alternative factual reading of this message>",
  "self": "<1 sentence: an alternative self-disclosure one could hear>",
  "relationship": "<1 sentence: an alternative relationship signal one could hear>",
  "appeal": "<1 sentence: an alternative appeal or wish one could hear>"
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
