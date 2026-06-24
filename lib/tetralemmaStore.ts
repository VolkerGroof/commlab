const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/["']/g, "");
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/["']/g, "");
const TTL = 8 * 60 * 60;
const KEY = (id: string) => `tetralemma:${id}`;

async function redisGet<T>(key: string): Promise<T | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }, next: { revalidate: 0 },
    });
    const { result } = await res.json();
    return result ? (JSON.parse(result) as T) : null;
  } catch { return null; }
}

async function redisSet(key: string, value: unknown): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([["SET", key, JSON.stringify(value), "EX", TTL]]),
    });
  } catch { /* ignore */ }
}

export interface TetralemmaSession {
  id: string;
  challenge: string;
  ideaA: string;
  ideaB: string;
  hostName: string;
  guestName: string;
  phase: "lobby" | "enter-ideas" | "flip" | "both" | "neither" | "tabula" | "done";
  currentSide: "A" | "B";
  currentContext: string;
  bothContexts:    string[];
  neitherContexts: string[];
  solution: string;
  readyHost:  boolean;
  readyGuest: boolean;
  bothReshuffleRole:    "host" | "guest";
  neitherReshuffleRole: "host" | "guest";
  createdAt: number;
}

export function getTetralemma(id: string) { return redisGet<TetralemmaSession>(KEY(id)); }

export async function createTetralemma(id: string, hostName: string, challenge: string): Promise<TetralemmaSession> {
  const s: TetralemmaSession = {
    id, challenge, ideaA: "", ideaB: "", hostName, guestName: "",
    phase: "lobby", currentSide: "A", currentContext: "",
    bothContexts: [], neitherContexts: [], solution: "",
    readyHost: false, readyGuest: false,
  bothReshuffleRole: "host" as "host"|"guest",
  neitherReshuffleRole: "host" as "host"|"guest",
  createdAt: Date.now(),
  };
  await redisSet(KEY(id), s);
  return s;
}

export async function mutateTetralemma(id: string, fn: (s: TetralemmaSession) => void): Promise<TetralemmaSession | null> {
  const s = await redisGet<TetralemmaSession>(KEY(id));
  if (!s) return null;
  fn(s);
  await redisSet(KEY(id), s);
  return s;
}
