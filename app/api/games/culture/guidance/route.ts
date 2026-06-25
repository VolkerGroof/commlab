import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { myName, allScores, participants, dimensions, allAgreements } = await req.json();

  const myScores = allScores[myName] ?? [];
  const otherProfiles = participants.filter((p: string) => p !== myName).map((p: string) => ({
    name: p,
    scores: allScores[p] ?? [],
  }));

  const dimSummary = dimensions.map((d: { name: string; leftLabel: string; rightLabel: string }, i: number) => {
    const myScore = myScores[i] ?? 3;
    const others = otherProfiles.map((o: { name: string; scores: number[] }) => `${o.name}:${o.scores[i] ?? 3}`).join(", ");
    const agreements = (allAgreements[i] ?? []).join("; ");
    return `${d.name}: You=${myScore}/6 (1=${d.leftLabel}, 6=${d.rightLabel}), Others: ${others}. Agreements: ${agreements || "none"}`;
  }).join("\n");

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `You are a team coach. Create a personalized watch-out guide for ${myName} based on their team's culture assessment.

Profile data:
${dimSummary}

For each of the 8 dimensions, write 1-2 sentences specifically for ${myName}: what to watch out for in HOW THE OTHERS on the team work, and one concrete tip for collaborating better with them.

Return ONLY valid JSON array of 8 objects:
[{"dimension":"...", "watchOut":"...", "tip":"..."}]`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  return Response.json({ guidance: JSON.parse(clean) });
}
