import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJson(raw: string) {
  return JSON.parse(raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim());
}

export async function POST(req: NextRequest) {
  const { troubleStatement, existingVoices } = await req.json();

  const voiceList = (existingVoices as { name: string; description: string }[])
    .map(v => `- ${v.name}: ${v.description}`)
    .join("\n");

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `You are an expert in Schulz von Thun's "Inneres Team" (Inner Team) model.

Challenge: "${troubleStatement}"

Inner team members already present:
${voiceList}

Which important perspectives might be MISSING? Consider archetypes like: The Fighter, The Dreamer, The Realist, The Inner Child, The Wise One, The Rebel, The Caretaker, The Critic, The Optimist, The Pessimist, The Perfectionist, The Protector.

Choose at most 3 that feel genuinely relevant to THIS specific situation. For each, write a warm, open question inviting the person to check inside. Also provide the positive intent this voice typically carries.

Return ONLY valid JSON:
{"suggestions":[{"name":"The Fighter","question":"Is there a part of you that wants to fight for what you believe in here — to not give up?","positiveIntent":"Protects your values and gives you the energy to stand up for what matters"}]}`
    }],
  });

  const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
  try {
    return NextResponse.json(parseJson(raw));
  } catch {
    return NextResponse.json({ error: "parse error", raw }, { status: 500 });
  }
}
