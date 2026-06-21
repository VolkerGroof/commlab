export interface EarResult {
  percent: number;
  label: string;
  insight: string;
}

export interface ParticipantAnalysis {
  fact: EarResult;
  self: EarResult;
  relationship: EarResult;
  appeal: EarResult;
}

export interface Participant {
  name: string;
  interpretation: string;
  done: boolean;
  role?: "speaker" | "listener";
  analysis?: ParticipantAnalysis;
}

export type Phase = "lobby" | "collecting" | "analyzing" | "results" | "questions";
export type Mode = "general" | "situation";

export interface Session {
  id: string;
  creatorName: string;
  message: string;
  mode: Mode;
  situationContext?: string;
  speakerName?: string;
  phase: Phase;
  participants: Record<string, Participant>;
  questions?: { fact: string; self: string; relationship: string; appeal: string };
  soloLocked?: boolean;
  nextSessionId?: string;
  nextSessionStarter?: string;
  createdAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __sessions: Map<string, Session> | undefined;
}

if (!globalThis.__sessions) globalThis.__sessions = new Map();
const sessions = globalThis.__sessions;

function cleanup() {
  const cutoff = Date.now() - 4 * 60 * 60 * 1000;
  for (const [id, s] of sessions.entries()) {
    if (s.createdAt < cutoff) sessions.delete(id);
  }
}

export function getSession(id: string) {
  return sessions.get(id);
}

export function createSession(id: string, creatorName: string): Session {
  cleanup();
  const s: Session = {
    id,
    creatorName,
    message: "",
    mode: "general",
    phase: "lobby",
    participants: { [creatorName]: { name: creatorName, interpretation: "", done: false } },
    createdAt: Date.now(),
  };
  sessions.set(id, s);
  return s;
}

export function mutate(id: string, fn: (s: Session) => void): Session | null {
  const s = sessions.get(id);
  if (!s) return null;
  fn(s);
  return s;
}
