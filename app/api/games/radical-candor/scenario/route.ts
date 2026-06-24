import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const RELATIONSHIPS = [
  { you: "Team Lead", other: "Direct Report" },
  { you: "Colleague", other: "Peer" },
  { you: "Manager", other: "Team Member" },
  { you: "Senior Developer", other: "Junior Developer" },
  { you: "Project Lead", other: "Contributor" },
  { you: "Department Head", other: "Manager" },
  { you: "Mentor", other: "Mentee" },
  { you: "Customer", other: "Account Manager" },
];

const NAMES = ["Alex", "Sam", "Jordan", "Morgan", "Taylor", "Jamie", "Riley", "Casey", "Dana", "Quinn", "Avery", "Drew"];

export async function GET() {
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const rels = shuffle(RELATIONSHIPS).slice(0, 5);
  const names = shuffle(NAMES);

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Generate 5 distinct, realistic workplace feedback scenarios for a feedback training exercise.

For each scenario provide:
- A short title (max 6 words)
- A 1-sentence teaser (for the selection list)
- The full observation: what the OTHER PERSON did — always written in third person using their name. Max 3 sentences. Be specific and concrete.
- Could be positive OR critical behavior.

Relationships to use (in order):
${rels.map((r, i) => `${i+1}. You=${r.you}, Other=${r.other} (name: ${names[i]})`).join("\n")}

Return ONLY valid JSON array of 5 objects:
[
  {
    "you": "...",
    "other": "...",
    "otherName": "...",
    "title": "Short title...",
    "teaser": "One-sentence preview...",
    "observation": "Third-person observation about what [name] did..."
  }
]`,
    }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
  return Response.json(JSON.parse(clean));
}
