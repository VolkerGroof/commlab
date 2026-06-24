import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const RELATIONSHIPS = [
  { you: "Team Lead", other: "direct report" },
  { you: "Colleague", other: "peer" },
  { you: "Manager", other: "team member" },
  { you: "Customer", other: "service rep" },
  { you: "Mentor", other: "mentee" },
  { you: "Project Lead", other: "contributor" },
  { you: "Senior Developer", other: "junior developer" },
  { you: "Department Head", other: "manager" },
];

export async function GET() {
  const rel = RELATIONSHIPS[Math.floor(Math.random() * RELATIONSHIPS.length)];

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Generate a realistic workplace feedback scenario.
You are: ${rel.you}
The other person is your: ${rel.other}

Generate a specific observation (what they did) that calls for feedback — could be positive OR critical.
Make it concrete and believable. 2-4 sentences max.

Return ONLY valid JSON:
{
  "you": "${rel.you}",
  "other": "${rel.other}",
  "observation": "Specific description of what happened or what they did..."
}`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  return Response.json(JSON.parse(clean));
}
