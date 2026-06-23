import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM = `You are an expert communication coach specializing in Schulz von Thun's 8 Communication Styles.

THE 8 STYLES (internal keys for JSON only — never name them to the user in questions):
1. aggressive-devaluing  – Attacks, criticizes loudly, becomes sarcastic; reacts to incompetence/injustice with aggression
2. distancing            – Withdraws emotionally, becomes cold/factual, blocks feelings, "just the facts"
3. selfless              – Quickly apologizes, backs down to restore harmony, ignores own needs
4. helping               – Takes over, fixes things themselves because they don't trust others to manage
5. needy-dependent       – Feels helpless, overwhelmed, waits or hopes someone else solves it
6. self-proving          – Justifies self extensively, lists achievements/arguments, fears being seen as incompetent
7. controlling           – Imposes rules, builds structure, references agreements, controls through process
8. expressive-dramatizing– Must voice all emotions immediately, dramatizes, needs others to witness their distress

YOUR TASK:
Analyze the situation description (and any follow-up answers if provided) to identify the DOMINANT style and CO-STYLE.

CONFIDENCE RULES:
- If you can identify dominant + co-style with high confidence → set needsMore: false, return full result
- If the description is ambiguous, vague, or could fit 3+ styles equally → set needsMore: true, return 2-3 follow-up questions

QUESTION RULES (when needsMore: true):
- Generate exactly 2-3 questions, each with exactly 6 answer options
- NEVER name the styles in questions or options — ask about inner feelings, motivations, instincts, or allergies
- Options must be concrete behaviors/reactions, written in first person
- You may use the "allergy test": ask what behaviors in OTHERS bother the person most
- Questions should feel personal and introspective, not like a test

RESPONSE LANGUAGE: Match the language of the user's description exactly.

Return ONLY valid JSON, no markdown:

When needsMore: true —
{
  "needsMore": true,
  "questions": [
    {
      "question": "Question text",
      "options": ["Option 1","Option 2","Option 3","Option 4","Option 5","Option 6"]
    }
  ]
}

When needsMore: false —
{
  "needsMore": false,
  "dominant": {
    "key": "<style key from list above>",
    "name": "<style name in user's language>",
    "tagline": "<1 punchy sentence that captures the core drive in user's language>",
    "description": "<2-3 sentences: what this style looks like in conflict, its hidden need, its shadow side>",
    "strength": "<1 sentence: genuine strength this style brings>"
  },
  "coStyle": {
    "key": "<style key>",
    "name": "<style name in user's language>",
    "tagline": "<1 punchy sentence>",
    "description": "<1-2 sentences>",
    "strength": "<1 sentence>"
  },
  "allergy": "<1-2 sentences: what behaviors in others typically drive this person crazy — and why that's a mirror>",
  "coaching": "<1 concrete, specific impulse for how to react more flexibly next time. Make it actionable, not generic.>"
}`;

export async function POST(req: NextRequest) {
  const { description, followUpAnswers } = await req.json() as {
    description: string;
    followUpAnswers?: { question: string; answer: string }[];
  };

  let userMessage = `SITUATION DESCRIPTION:\n${description}`;
  if (followUpAnswers?.length) {
    userMessage += `\n\nFOLLOW-UP ANSWERS:\n` + followUpAnswers
      .map(a => `Q: ${a.question}\nA: ${a.answer}`)
      .join("\n\n");
    userMessage += `\n\nBased on the description AND the follow-up answers, now return the full result (needsMore: false).`;
  }

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  return Response.json(JSON.parse(clean));
}
