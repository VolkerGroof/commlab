import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { steps } = await req.json() as {
    steps: { key: string; title: string; input: string }[];
  };

  const stepsText = steps.map(s => `${s.title}:\n"${s.input}"`).join("\n\n");

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `You are a Fierce Conversation coach (Susan Scott method).

Weave these 7 elements into a powerful, direct 60-second opening statement. Rules:
- Maximum 150 words (60 seconds speaking)
- Direct, no softening or hedging language
- No preamble — start with the issue immediately
- Flow naturally from one element to the next
- End with the invitation question (step 7) exactly as written
- Do NOT add anything beyond what the user provided

${stepsText}

Return ONLY the assembled statement, nothing else.`,
    }],
  });

  const assembled = (msg.content[0] as { type: string; text: string }).text.trim();
  const wordCount = assembled.split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.round(wordCount / 2.5);

  return Response.json({ assembled, wordCount, estimatedSeconds });
}
