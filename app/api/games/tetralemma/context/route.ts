import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { challenge, ideaA, ideaB, position, side } = await req.json();

  let prompt = "";

  if (position === "flip") {
    const activeIdea = side === "A" ? ideaA : ideaB;
    const inactiveIdea = side === "A" ? ideaB : ideaA;
    prompt = `Challenge: "${challenge}"
Idea A: "${ideaA}"
Idea B: "${ideaB}"

Generate a vivid, concrete scenario or context in which "${activeIdea}" is clearly the RIGHT approach — and "${inactiveIdea}" would NOT work or would be wrong. Be specific and imaginative. 2-3 sentences max. Do not mention "Idea A" or "Idea B" — describe the situation directly.`;
  }

  if (position === "both") {
    prompt = `Challenge: "${challenge}"
Idea A: "${ideaA}"
Idea B: "${ideaB}"

Generate a surprising, creative scenario in which BOTH "${ideaA}" AND "${ideaB}" are simultaneously true, valid, and work perfectly together — even though they might seem contradictory. Be specific and concrete. 2-3 sentences. Do not mention "Idea A" or "Idea B".`;
  }

  if (position === "neither") {
    prompt = `Challenge: "${challenge}"
Idea A: "${ideaA}"
Idea B: "${ideaB}"

Generate a scenario in which NEITHER "${ideaA}" NOR "${ideaB}" is the right answer — where a completely different approach is needed. Be specific and thought-provoking. 2-3 sentences. Do not mention "Idea A" or "Idea B".`;
  }

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const context = (msg.content[0] as { type: string; text: string }).text.trim();
  return Response.json({ context });
}
