// Upstash Redis via REST API — no SDK needed, works across all Vercel instances

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/["']/g, "");
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/["']/g, "");
const TTL = 8 * 60 * 60; // 8 hours

async function redisGet<T>(key: string): Promise<T | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.error("[Johari] Upstash env vars not set");
    return null;
  }
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) { console.error("[Johari] GET failed:", res.status); return null; }
    const body = await res.json();
    return body.result ? (JSON.parse(body.result) as T) : null;
  } catch (e) {
    console.error("[Johari] GET error:", e);
    return null;
  }
}

async function redisSet(key: string, value: unknown): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([["SET", key, JSON.stringify(value), "EX", TTL]]),
    });
    if (!res.ok) console.error("[Johari] SET failed:", res.status, await res.text());
  } catch (e) {
    console.error("[Johari] SET error:", e);
  }
}

export const KEY = (id: string) => `johari:${id}`;

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Store functions ───────────────────────────────────────────────────────────

export async function getJohari(id: string): Promise<JohariSession | null> {
  return redisGet<JohariSession>(KEY(id));
}

export async function createJohari(id: string, starterName: string): Promise<JohariSession> {
  const s: JohariSession = {
    id, phase: "lobby", category: "", attributes: [],
    participants: [{ name: starterName, done: false }],
    selections: {}, createdAt: Date.now(),
  };
  await redisSet(KEY(id), s);
  return s;
}

export async function mutateJohari(id: string, fn: (s: JohariSession) => void): Promise<JohariSession | null> {
  const s = await redisGet<JohariSession>(KEY(id));
  if (!s) return null;
  fn(s);
  await redisSet(KEY(id), s);
  return s;
}

// For diagnostics
export function getUpstashStatus() {
  return { url: UPSTASH_URL ? "set" : "MISSING", token: UPSTASH_TOKEN ? "set" : "MISSING" };
}
