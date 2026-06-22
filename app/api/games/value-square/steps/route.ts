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

Generate 3–4 concrete, actionable development steps for this direction. Make them practical and specific — things a person can actually do or practice. Respond in the SAME language as the values. Return ONLY a valid JSON array of strings: ["Step 1","Step 2","Step 3"]`,
    }],
  });
  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  const suggestions = JSON.parse(clean);
  return Response.json({ suggestions });
}
