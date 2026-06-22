import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { name1, name2, s1, s2, f1, f2, type } = await req.json();

  const context = `Vicious circle between ${name1} and ${name2}:
- ${name1} says/does: "${s1}"
- ${name2} feels: "${f2}"
- ${name2} says/does: "${s2}"
- ${name1} feels: "${f1}"`;

  const prompt = type === "escalate"
    ? `${context}

In 2–3 short bullet points, explain how this vicious circle escalates over time — what makes it self-reinforcing and harder to break the longer it goes on. Be concrete, not generic. Detect the language from the names/content and respond in that same language. Return ONLY a JSON array of strings: ["point 1","point 2","point 3"]`
    : `${context}

In 2–3 short bullet points, suggest concrete ways to break this specific vicious circle. Focus on what either person could do differently — small, realistic steps. Not generic advice. Detect the language from the names/content and respond in that same language. Return ONLY a JSON array of strings: ["suggestion 1","suggestion 2","suggestion 3"]`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  const suggestions = JSON.parse(clean);
  return Response.json({ suggestions });
}
