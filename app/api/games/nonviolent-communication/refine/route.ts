import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const STEP_GUIDANCE: Record<string, string> = {
  observation: "Remove ALL evaluation, judgment, interpretation, or exaggeration. Make it purely factual — what a camera would record. No 'always', 'never', 'you are...'.",
  feeling: "Use genuine feeling words (scared, frustrated, sad, relieved, excited...). Remove pseudo-feelings that are actually thoughts: avoid 'I feel like...', 'I feel that...', 'I feel you...', or assessments like 'I feel ignored/disrespected' (those are interpretations).",
  need: "Connect to universal human needs (autonomy, connection, safety, respect, fairness, order, belonging, understanding, contribution, rest...). These are deep needs — not strategies, not specific actions, not about the other person.",
  request: "Make it specific, positive (what you DO want, not what you don't), and actionable right now. Frame it as a genuine request, not a demand: 'Would you be willing to...?' The other person must be able to say no without consequences.",
};

export async function POST(req: NextRequest) {
  const { stepKey, stepTitle, userInput } = await req.json();

  const guidance = STEP_GUIDANCE[stepKey] ?? "";

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `You are a Nonviolent Communication (NVC) coach trained in Marshall Rosenberg's method.

Step: ${stepTitle}
NVC guidance for this step: ${guidance}

User's draft: "${userInput}"

Improve this to align with NVC principles. Keep it to 1-2 sentences max. Always respond in English. Return ONLY the improved text, no explanation, no quotes.`,
    }],
  });

  const suggestion = (msg.content[0] as { type: string; text: string }).text.trim();
  return Response.json({ suggestion });
}
