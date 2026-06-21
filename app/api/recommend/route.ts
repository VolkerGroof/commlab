import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GAMES = [
  {
    id: "communication-square",
    title: "The Communication Square",
    description:
      "Analyse a message across four dimensions: facts, self-disclosure, relationship signal, and appeal. Best for: misunderstandings, analysing what was said vs heard, conflict debrief, preparing a difficult conversation.",
  },
  {
    id: "inner-team",
    title: "The Inner Team",
    description:
      "Map inner conflicting voices before a decision or difficult conversation. Best for: inner conflict, indecision, ambivalence, self-reflection before an important talk.",
  },
  {
    id: "value-square",
    title: "The Value Square",
    description:
      "Explore the healthy balance between a strength and its overdone shadow. Best for: feedback conversations, personal development, understanding polarities in a team.",
  },
  {
    id: "vicious-circle",
    title: "The Vicious Circle",
    description:
      "Map a stuck loop between two people. Best for: recurring conflicts, relationship dynamics that repeat, team communication blocks.",
  },
  {
    id: "riemann-thomann",
    title: "Riemann-Thomann",
    description:
      "Understand different human needs for closeness, distance, stability, change. Best for: team diversity, understanding why people clash on work style, collaboration challenges.",
  },
  {
    id: "communication-styles",
    title: "8 Communication Styles",
    description:
      "Identify a person's default interaction pattern. Best for: self-awareness, understanding a colleague's behaviour, coaching conversations.",
  },
];

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ ids: [] });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `You are a communication tools assistant. Based on the user's problem or question, select which of the following tools are most relevant. Return ONLY a JSON array of matching tool IDs, ordered by relevance. Return at least 1 and at most 4. Return the raw JSON array only, no explanation.

Tools:
${GAMES.map((g) => `- id: "${g.id}"\n  ${g.description}`).join("\n")}

User input: "${query}"

Response format: ["id1", "id2"]`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";

  try {
    const ids = JSON.parse(text.trim());
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}
