import { kv } from "@vercel/kv";

const TTL = 8 * 60 * 60; // 8 hours in seconds
const KEY = (id: string) => `johari:${id}`;

export type JohariSelections = Record<string, Record<string, string[]>>;

export interface JohariParticipant {
  name: string;
  done: boolean;
}

export interface JohariSession {
  id: string;
  phase: "lobby" | "setup" | "assessing" | "results";
  category: string;
  attributes: string[];
  participants: JohariParticipant[];
  selections: JohariSelections;
  createdAt: number;
}

export async function getJohari(id: string): Promise<JohariSession | null> {
  return kv.get<JohariSession>(KEY(id));
}

export async function createJohari(id: string, starterName: string): Promise<JohariSession> {
  const s: JohariSession = {
    id, phase: "lobby", category: "", attributes: [],
    participants: [{ name: starterName, done: false }],
    selections: {}, createdAt: Date.now(),
  };
  await kv.set(KEY(id), s, { ex: TTL });
  return s;
}

export async function mutateJohari(id: string, fn: (s: JohariSession) => void): Promise<JohariSession | null> {
  const s = await kv.get<JohariSession>(KEY(id));
  if (!s) return null;
  fn(s);
  await kv.set(KEY(id), s, { ex: TTL });
  return s;
}
