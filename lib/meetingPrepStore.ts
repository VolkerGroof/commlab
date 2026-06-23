// Upstash Redis — persistent across Vercel instances

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/["']/g, "");
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim().replace(/["']/g, "");
const TTL = 12 * 60 * 60; // 12 hours
const KEY = (id: string) => `meetingprep:${id}`;

async function redisGet<T>(key: string): Promise<T | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      next: { revalidate: 0 },
    });
    const body = await res.json();
    return body.result ? (JSON.parse(body.result) as T) : null;
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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MeetingEntry {
  history: string;       // Vorgeschichte
  topic: string;         // Das Thema
  interpersonal: string; // Zwischenmenschliches
  goal: string;          // Das Ziel
}

export interface MeetingParticipant {
  name: string;
  done: boolean;
}

export interface MeetingConsolidation {
  history: string;
  topic: string;
  interpersonal: string;
  goal: string;
  currentDimension: number; // 0=history,1=topic,2=interpersonal,3=goal, 4=done
}

export interface MeetingSession {
  id: string;
  title: string;
  hostName: string;
  phase: "lobby" | "filling" | "consolidating" | "results";
  participants: MeetingParticipant[];
  entries: Record<string, MeetingEntry>;       // name → entry
  consolidation: MeetingConsolidation;
  createdAt: number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export function getMeeting(id: string) { return redisGet<MeetingSession>(KEY(id)); }

export async function createMeeting(id: string, hostName: string, title: string): Promise<MeetingSession> {
  const s: MeetingSession = {
    id, title, hostName, phase: "lobby",
    participants: [{ name: hostName, done: false }],
    entries: {},
    consolidation: { history: "", topic: "", interpersonal: "", goal: "", currentDimension: 0 },
    createdAt: Date.now(),
  };
  await redisSet(KEY(id), s);
  return s;
}

export async function mutateMeeting(id: string, fn: (s: MeetingSession) => void): Promise<MeetingSession | null> {
  const s = await redisGet<MeetingSession>(KEY(id));
  if (!s) return null;
  fn(s);
  await redisSet(KEY(id), s);
  return s;
}
