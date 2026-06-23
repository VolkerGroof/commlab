import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { stepTitle, stepInstruction, userInput } = await req.json();

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `You are a Fierce Conversation coach (Susan Scott method).

Step: ${stepTitle}
Guideline: ${stepInstruction}
User's draft: "${userInput}"

Improve this to be more direct, specific, and impactful — without softening the message. Keep it to 1-2 sentences max. Return ONLY the improved text, no explanation, no quotes.`,
    }],
  });

  const suggestion = (msg.content[0] as { type: string; text: string }).text.trim();
  return Response.json({ suggestion });
}
