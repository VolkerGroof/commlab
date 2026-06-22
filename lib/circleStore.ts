export interface CircleData {
  s1: string; // own statement/behavior
  s2: string; // other's statement/behavior
  f2: string; // other's feeling (assumed)
  f1: string; // own feeling
  r1: string; // reflection: how did it escalate?
  r2: string; // reflection: how to break it?
}

export interface CircleSession {
  id: string;
  name1: string;
  name2: string;
  circle1?: Partial<CircleData>;
  circle2?: Partial<CircleData>;
  done1: boolean;
  done2: boolean;
  createdAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __circleSessions: Map<string, CircleSession> | undefined;
}

if (!globalThis.__circleSessions) globalThis.__circleSessions = new Map();
const store = globalThis.__circleSessions;

function cleanup() {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [id, s] of store.entries()) {
    if (s.createdAt < cutoff) store.delete(id);
  }
}

export function getCircleSession(id: string) {
  return store.get(id) ?? null;
}

export function createCircleSession(id: string, name1: string, name2: string): CircleSession {
  cleanup();
  const s: CircleSession = { id, name1, name2, done1: false, done2: false, createdAt: Date.now() };
  store.set(id, s);
  return s;
}

export function submitCircle(id: string, player: 1 | 2, data: Partial<CircleData>): CircleSession | null {
  const s = store.get(id);
  if (!s) return null;
  if (player === 1) { s.circle1 = data; s.done1 = true; }
  else              { s.circle2 = data; s.done2 = true; }
  return s;
}
