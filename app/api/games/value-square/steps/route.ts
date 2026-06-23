import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { squareData, direction, existingSteps } = await req.json();
  const { primaryValue, complementaryValue, excessPrimary, excessComplementary, direction1, direction2 } = squareData;
  const fromExcess = direction === 1 ? excessPrimary : excessComplementary;
  const towardValue = direction === 1 ? complementaryValue : primaryValue;
  const dirLabel = direction === 1 ? direction1 : direction2;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Value Square context:
- Primary value: "${primaryValue}" / Complementary: "${complementaryValue}"
- Development direction: from "${fromExcess}" toward more "${towardValue}"
- Direction description: "${dirLabel}"
${existingSteps ? `- User has already noted: "${existingSteps}"` : ""}

Generate 3–4 concrete, actionable development steps for this direction.

IMPORTANT: The goal is BALANCE, not jumping to the opposite extreme. Steps should help the person hold both "${primaryValue}" and "${towardValue}" simultaneously — small, mindful experiments that introduce the missing quality without abandoning the original value. Avoid suggestions that sound like "stop doing X" or "just be more Y." Instead, suggest practices that enrich and round out the existing value.

Make them practical and specific — things a person can actually try in everyday life. Detect the language of the values and respond in that exact same language (English values → English output, German values → German output). Return ONLY a valid JSON array of strings: ["Step 1","Step 2","Step 3"]`,
    }],
  });
  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  const suggestions = JSON.parse(clean);
  return Response.json({ suggestions });
}
