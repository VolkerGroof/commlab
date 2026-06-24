const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/["']/g, "");
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/["']/g, "");
const TTL = 12 * 60 * 60;
const KEY = (id: string) => `culture:${id}`;

async function rGet<T>(key: string): Promise<T | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }, next: { revalidate: 0 },
    });
    const { result } = await res.json();
    return result ? JSON.parse(result) as T : null;
  } catch { return null; }
}
async function rSet(key: string, val: unknown) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([["SET", key, JSON.stringify(val), "EX", TTL]]),
    });
  } catch { /* ignore */ }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CultureAgreement {
  id: string;
  text: string;
  approvals: string[]; // participant names who accepted
}

export interface CultureSession {
  id: string;
  hostName: string;
  participants: string[];
  phase: "lobby" | "running" | "done";
  currentDim: number;   // 0-7
  dimPhase: "scoring" | "discussing" | "done"; // within dimension
  // Current dimension state
  scores: Record<string, number[]>;  // name → [3 answers]
  agreements: CultureAgreement[];
  dimReadyToAdvance: string[];       // names who clicked "Move on"
  // Accumulated
  allScores: Record<string, number[]>;   // name → [8 avg scores]
  allAgreements: string[][];             // [dimIndex] → [agreement texts]
  createdAt: number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export function getCulture(id: string) { return rGet<CultureSession>(KEY(id)); }

export async function createCulture(id: string, hostName: string): Promise<CultureSession> {
  const s: CultureSession = {
    id, hostName, participants: [hostName],
    phase: "lobby", currentDim: 0, dimPhase: "scoring",
    scores: {}, agreements: [], dimReadyToAdvance: [],
    allScores: {}, allAgreements: Array(8).fill([]),
    createdAt: Date.now(),
  };
  await rSet(KEY(id), s);
  return s;
}

export async function mutateCulture(id: string, fn: (s: CultureSession) => void): Promise<CultureSession | null> {
  const s = await rGet<CultureSession>(KEY(id));
  if (!s) return null;
  fn(s);
  await rSet(KEY(id), s);
  return s;
}
