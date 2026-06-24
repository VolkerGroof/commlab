import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { you, other, observation, feedback, quadrant } = await req.json();

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `You are a Radical Candor coach. Rewrite this feedback to land in the Radical Candor quadrant — showing genuine care for the person while being completely direct about what needs to change.

Context:
- You are a ${you} speaking to your ${other}
- Observation: "${observation}"
- Their feedback (currently in "${quadrant}"): "${feedback}"

Write an improved version that:
- Opens with genuine care or positive intent
- States the specific behavior clearly and directly
- Explains the impact
- Invites dialogue
- Sounds natural and human, not corporate

Return ONLY the improved feedback text, nothing else. 3-5 sentences.`,
    }],
  });

  const improved = (msg.content[0] as { type: string; text: string }).text.trim();
  return Response.json({ improved });
}
