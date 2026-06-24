import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { you, other, observation, feedback } = await req.json();

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `You are a Radical Candor expert coach (Kim Scott's framework).

Radical Candor Matrix:
- X-axis: "Care Personally" (0=not at all, 10=deeply)
- Y-axis: "Challenge Directly" (0=avoids conflict, 10=completely direct)

Quadrants:
- Radical Candor: high care (≥6) + high challenge (≥6) → GREEN, ideal
- Ruinous Empathy: high care (≥6) + low challenge (<6) → YELLOW, too soft
- Obnoxious Aggression: low care (<6) + high challenge (≥6) → RED, harsh without heart
- Manipulative Insincerity: low care (<6) + low challenge (<6) → RED, fake/passive

Scenario:
- You are a ${you} speaking to your ${other}
- Observation: "${observation}"
- The feedback they gave: "${feedback}"

Analyze this feedback carefully. Return ONLY valid JSON:
{
  "careScore": <0-10>,
  "challengeScore": <0-10>,
  "quadrant": "radical-candor" | "ruinous-empathy" | "obnoxious-aggression" | "manipulative-insincerity",
  "status": "green" | "yellow" | "red",
  "quadrantLabel": "Radical Candor" | "Ruinous Empathy" | "Obnoxious Aggression" | "Manipulative Insincerity",
  "howTheyFeel": "1-2 sentences: how would the ${other} likely feel receiving this feedback?",
  "coaching": ["specific coaching tip 1", "specific coaching tip 2"],
  "summary": "1-2 sentences: what works and what to improve in this feedback"
}`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  return Response.json(JSON.parse(clean));
}
