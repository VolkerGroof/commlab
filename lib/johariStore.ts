export interface JohariParticipant {
  name: string;
  done: boolean;
}

// ratings[rater][ratee][questionIndex] = true (yes) | false (no)
export type JohariRatings = Record<string, Record<string, boolean[]>>;

export interface JohariSession {
  id: string;
  phase: "lobby" | "setup" | "assessing" | "results";
  category: string;
  questions: string[]; // 5 questions with [name] placeholder
  participants: JohariParticipant[];
  ratings: JohariRatings;
  createdAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __johariSessions: Map<string, JohariSession> | undefined;
}
if (!globalThis.__johariSessions) globalThis.__johariSessions = new Map();
const store = globalThis.__johariSessions;

function cleanup() {
  const cutoff = Date.now() - 8 * 60 * 60 * 1000;
  for (const [id, s] of store.entries()) {
    if (s.createdAt < cutoff) store.delete(id);
  }
}

export function getJohari(id: string) { return store.get(id) ?? null; }

export function createJohari(id: string, starterName: string): JohariSession {
  cleanup();
  const s: JohariSession = {
    id, phase: "lobby", category: "", questions: [],
    participants: [{ name: starterName, done: false }],
    ratings: {}, createdAt: Date.now(),
  };
  store.set(id, s);
  return s;
}

export function mutateJohari(id: string, fn: (s: JohariSession) => void): JohariSession | null {
  const s = store.get(id);
  if (!s) return null;
  fn(s);
  return s;
}
