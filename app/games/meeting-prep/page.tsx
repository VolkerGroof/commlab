"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { MeetingSession, MeetingEntry } from "@/lib/meetingPrepStore";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLOR  = "#c0392b";
const FONT   = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const DIMS = [
  {
    key: "history" as const,
    label: "Background",
    sub: "Der Eingangskanal",
    question: "What has happened leading up to this meeting? Why are we here today?",
    placeholder: "A previous conflict, missed deadline, decision that needs follow-up…",
    color: "#7c6fcd",
    pos: "left",
  },
  {
    key: "topic" as const,
    label: "The Topic",
    sub: "Der Oberbauch",
    question: "What are the concrete facts, agenda items, or subjects on the table?",
    placeholder: "Budget review, Q3 results, the new process proposal…",
    color: "#e07a3a",
    pos: "top",
  },
  {
    key: "interpersonal" as const,
    label: "Who & Dynamics",
    sub: "Der Unterbauch",
    question: "Who is in the room? What roles, hierarchies, or hidden tensions exist?",
    placeholder: "Alice leads the team but Bob has seniority; there's tension between X and Y…",
    color: "#378add",
    pos: "bottom",
  },
  {
    key: "goal" as const,
    label: "The Goal",
    sub: "Der Ausgangskanal",
    question: "What should come out of this meeting? What are the concrete next steps?",
    placeholder: "A decision on X, agreement on next steps, clarity on responsibilities…",
    color: "#1d9e75",
    pos: "right",
  },
] as const;

type DimKey = "history" | "topic" | "interpersonal" | "goal";
type UIPhase = "start" | "filling" | "result" | "join" | "lobby" | "multi-filling" | "waiting" | "consolidating" | "multi-result";

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputSt(rows?: number): React.CSSProperties {
  return {
    width: "100%", fontSize: 14, padding: "12px 16px", border: "1.5px solid #e0e0e0",
    borderRadius: 12, outline: "none", boxSizing: "border-box", color: "#111",
    fontFamily: FONT, background: "#fff", resize: rows ? "none" : undefined, lineHeight: 1.6,
  };
}

function wrap(content: React.ReactNode, title = "Meeting Preparation") {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: FONT }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #eee", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← CommLab</Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{title}</span>
        <span />
      </div>
      <div style={{ paddingTop: 52 }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "48px 24px 80px" }}>
          {content}
        </div>
      </div>
    </div>
  );
}

// ── Meeting Diagram (SVG) ─────────────────────────────────────────────────────

function MeetingDiagram({ entry, title, participants, isTeam }: {
  entry: Partial<MeetingEntry>;
  title: string;
  participants?: string[];
  isTeam?: boolean;
}) {
  const trunc = (s: string | undefined, n = 60) => s ? (s.length > n ? s.slice(0, n) + "…" : s) : "";

  return (
    <svg viewBox="0 0 600 380" style={{ width: "100%", maxWidth: 600, display: "block", margin: "0 auto" }}>
      {/* Center oval */}
      <ellipse cx="300" cy="190" rx="90" ry="68" fill="#fff5f0" stroke={COLOR} strokeWidth="2.5" />
      <text x="300" y="183" textAnchor="middle" fontSize="11" fontWeight="700" fill={COLOR} letterSpacing="0.05em">MEETING</text>
      <text x="300" y="197" textAnchor="middle" fontSize="10" fill="#888">{title.length > 22 ? title.slice(0,22)+"…" : title}</text>
      {isTeam && <text x="300" y="212" textAnchor="middle" fontSize="9" fill="#aaa">Team: {(participants ?? []).join(", ").slice(0,28)}</text>}

      {/* Arrows */}
      {/* LEFT → center */}
      <line x1="165" y1="190" x2="210" y2="190" stroke="#7c6fcd" strokeWidth="2.5" markerEnd="url(#arrP)"/>
      {/* center → RIGHT */}
      <line x1="390" y1="190" x2="435" y2="190" stroke="#1d9e75" strokeWidth="2.5" markerEnd="url(#arrG)"/>
      {/* TOP ↓ */}
      <line x1="300" y1="122" x2="300" y2="152" stroke="#e07a3a" strokeWidth="2.5" markerEnd="url(#arrT)" />
      {/* center ↓ BOTTOM */}
      <line x1="300" y1="258" x2="300" y2="228" stroke="#378add" strokeWidth="2.5" markerEnd="url(#arrI)" />

      <defs>
        {[["arrP","#7c6fcd"],["arrG","#1d9e75"],["arrT","#e07a3a"],["arrI","#378add"]].map(([id,col]) => (
          <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 Z" fill={col as string} />
          </marker>
        ))}
      </defs>

      {/* LEFT box — History */}
      <rect x="4" y="150" width="155" height="80" rx="10" fill="#7c6fcd12" stroke="#7c6fcd50" strokeWidth="1.5"/>
      <text x="82" y="169" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c6fcd" letterSpacing="0.06em">BACKGROUND</text>
      <text x="82" y="184" textAnchor="middle" fontSize="9" fill={entry.history ? "#555" : "#ccc"}>{trunc(entry.history, 22) || "—"}</text>
      <text x="82" y="197" textAnchor="middle" fontSize="9" fill="#555">{entry.history ? trunc(entry.history.slice(22), 22) : ""}</text>
      <text x="82" y="210" textAnchor="middle" fontSize="9" fill="#555">{entry.history ? trunc(entry.history.slice(44), 22) : ""}</text>

      {/* TOP box — Topic */}
      <rect x="175" y="4" width="250" height="112" rx="10" fill="#e07a3a12" stroke="#e07a3a50" strokeWidth="1.5"/>
      <text x="300" y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e07a3a" letterSpacing="0.06em">THE TOPIC</text>
      <text x="300" y="40" textAnchor="middle" fontSize="9" fill={entry.topic ? "#555" : "#ccc"}>{trunc(entry.topic, 35) || "—"}</text>
      <text x="300" y="55" textAnchor="middle" fontSize="9" fill="#555">{trunc(entry.topic?.slice(35) ?? "", 35)}</text>
      <text x="300" y="70" textAnchor="middle" fontSize="9" fill="#555">{trunc(entry.topic?.slice(70) ?? "", 35)}</text>
      <text x="300" y="85" textAnchor="middle" fontSize="9" fill="#555">{trunc(entry.topic?.slice(105) ?? "", 35)}</text>

      {/* BOTTOM box — Interpersonal */}
      <rect x="175" y="264" width="250" height="112" rx="10" fill="#378add12" stroke="#378add50" strokeWidth="1.5"/>
      <text x="300" y="283" textAnchor="middle" fontSize="9" fontWeight="700" fill="#378add" letterSpacing="0.06em">WHO &amp; DYNAMICS</text>
      <text x="300" y="299" textAnchor="middle" fontSize="9" fill={entry.interpersonal ? "#555" : "#ccc"}>{trunc(entry.interpersonal, 35) || "—"}</text>
      <text x="300" y="314" textAnchor="middle" fontSize="9" fill="#555">{trunc(entry.interpersonal?.slice(35) ?? "", 35)}</text>
      <text x="300" y="329" textAnchor="middle" fontSize="9" fill="#555">{trunc(entry.interpersonal?.slice(70) ?? "", 35)}</text>
      <text x="300" y="344" textAnchor="middle" fontSize="9" fill="#555">{trunc(entry.interpersonal?.slice(105) ?? "", 35)}</text>

      {/* RIGHT box — Goal */}
      <rect x="441" y="150" width="155" height="80" rx="10" fill="#1d9e7512" stroke="#1d9e7550" strokeWidth="1.5"/>
      <text x="519" y="169" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d9e75" letterSpacing="0.06em">THE GOAL</text>
      <text x="519" y="184" textAnchor="middle" fontSize="9" fill={entry.goal ? "#555" : "#ccc"}>{trunc(entry.goal, 22) || "—"}</text>
      <text x="519" y="197" textAnchor="middle" fontSize="9" fill="#555">{trunc(entry.goal?.slice(22) ?? "", 22)}</text>
      <text x="519" y="210" textAnchor="middle" fontSize="9" fill="#555">{trunc(entry.goal?.slice(44) ?? "", 22)}</text>
    </svg>
  );
}

// ── API ───────────────────────────────────────────────────────────────────────

async function apiPost(action: string, data: Record<string, unknown>): Promise<MeetingSession | null> {
  const res = await fetch("/api/games/meeting-prep/session", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function apiGet(id: string): Promise<MeetingSession | null> {
  const res = await fetch(`/api/games/meeting-prep/session?id=${id}`);
  if (!res.ok) return null;
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

function MeetingPrepInner() {
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("s");

  const [uiPhase, setUiPhase] = useState<UIPhase>(urlSessionId ? "join" : "start");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [isMulti, setIsMulti] = useState(false);

  // Solo entry
  const [entry, setEntry] = useState<MeetingEntry>({ history: "", topic: "", interpersonal: "", goal: "" });
  const [soloStep, setSoloStep] = useState(0); // 0-3

  // Multi state
  const [sessionId, setSessionId] = useState(urlSessionId ?? "");
  const [myName, setMyName]       = useState("");
  const [nameInput, setNameInput] = useState("");
  const [session, setSession]     = useState<MeetingSession | null>(null);
  const [joinError, setJoinError] = useState("");
  const [multiEntry, setMultiEntry] = useState<MeetingEntry>({ history: "", topic: "", interpersonal: "", goal: "" });
  const [multiStep, setMultiStep] = useState(0);
  const [consolInput, setConsolInput] = useState("");
  const [consolSaving, setConsolSaving] = useState(false);

  // Poll
  const doPolling = useCallback(async () => {
    if (!sessionId) return;
    const s = await apiGet(sessionId);
    if (!s) return;
    setSession(s);
    if (s.phase === "filling"       && uiPhase === "lobby")         setUiPhase("multi-filling");
    if (s.phase === "consolidating" && uiPhase === "waiting")       setUiPhase("consolidating");
    if (s.phase === "consolidating" && uiPhase === "consolidating") {/* stay, update session */}
    if (s.phase === "results")      setUiPhase("multi-result");
  }, [sessionId, uiPhase]);

  useEffect(() => {
    if (!sessionId || uiPhase === "start" || uiPhase === "join" || uiPhase === "result" || uiPhase === "filling") return;
    if (uiPhase === "multi-result") return;
    const t = setInterval(doPolling, 3000);
    return () => clearInterval(t);
  }, [sessionId, uiPhase, doPolling]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/games/meeting-prep?s=${sessionId}` : "";

  // ── Solo flow ──

  function setField(key: DimKey, val: string) { setEntry(e => ({ ...e, [key]: val })); }

  if (uiPhase === "start") return wrap(<>
    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>Meeting Preparation</h1>
    <p style={{ fontSize: 15, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
      Prepare your next meeting or conversation across 4 dimensions — so nothing important gets missed.
    </p>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>MEETING / CONVERSATION TITLE</label>
    <input value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} placeholder="e.g. Q3 Review, 1:1 with Sarah, Team Conflict Talk…" autoFocus style={{ ...inputSt(), marginBottom: 20 }} />
    <label style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 12 }}>FORMAT</label>
    <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
      <button onClick={() => setIsMulti(false)} style={{ flex: 1, padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${!isMulti ? COLOR : "#e0e0e0"}`, background: !isMulti ? `${COLOR}10` : "#fff", color: !isMulti ? COLOR : "#888", fontFamily: FONT }}>
        🔍 Solo — prepare alone
      </button>
      <button onClick={() => setIsMulti(true)} style={{ flex: 1, padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${isMulti ? COLOR : "#e0e0e0"}`, background: isMulti ? `${COLOR}10` : "#fff", color: isMulti ? COLOR : "#888", fontFamily: FONT }}>
        👥 Team — invite others
      </button>
    </div>
    <button disabled={!meetingTitle.trim()} onClick={async () => {
      if (!isMulti) { setUiPhase("filling"); setSoloStep(0); return; }
      const n = myName || "Host";
      const s = await apiPost("create", { hostName: n, title: meetingTitle.trim() });
      if (s) { setSessionId(s.id); setMyName(n); setSession(s); setUiPhase("lobby"); }
    }} style={{
      width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: meetingTitle.trim() ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
      background: meetingTitle.trim() ? COLOR : "#e8e8e8", color: meetingTitle.trim() ? "#fff" : "#bbb",
    }}>
      {isMulti ? "Create session & get link →" : "Start preparation →"}
    </button>
    {isMulti && (
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>YOUR NAME (as host)</label>
        <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Your name…" style={{ ...inputSt() }} />
      </div>
    )}
  </>);

  // ── Solo filling ──
  if (uiPhase === "filling") {
    const dim = DIMS[soloStep];
    return wrap(<>
      <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 4px" }}>{meetingTitle}</p>
      <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
        {DIMS.map((d, i) => <div key={d.key} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= soloStep ? d.color : "#e8e8e8" }} />)}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 4px" }}>STEP {soloStep + 1} OF 4</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: dim.color, margin: "0 0 4px" }}>{dim.label}</h2>
      <p style={{ fontSize: 12, color: "#bbb", margin: "0 0 10px", fontStyle: "italic" }}>{dim.sub}</p>
      <p style={{ fontSize: 14, color: "#666", margin: "0 0 14px", lineHeight: 1.6 }}>{dim.question}</p>
      <textarea value={entry[dim.key]} onChange={e => setField(dim.key, e.target.value)} placeholder={dim.placeholder} rows={4} autoFocus style={{ ...inputSt(4), marginBottom: 14 }} />
      <div style={{ display: "flex", gap: 10 }}>
        {soloStep > 0 && <button onClick={() => setSoloStep(s => s - 1)} style={{ padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1.5px solid #e0e0e0", background: "#fff", color: "#888", fontFamily: FONT }}>← Back</button>}
        <button onClick={() => soloStep < 3 ? setSoloStep(s => s + 1) : setUiPhase("result")} style={{ flex: 1, padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: FONT, background: dim.color, color: "#fff" }}>
          {soloStep < 3 ? "Continue →" : "See my preparation →"}
        </button>
      </div>
    </>);
  }

  // ── Solo result ──
  if (uiPhase === "result") return wrap(<>
    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 4px" }}>YOUR MEETING PREPARATION</p>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: COLOR, margin: "0 0 20px" }}>{meetingTitle}</h2>
    <MeetingDiagram entry={entry} title={meetingTitle} />
    <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0 28px" }}>
      {DIMS.map(d => (
        <div key={d.key} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${d.color}30`, overflow: "hidden" }}>
          <div style={{ background: `${d.color}08`, borderBottom: `1px solid ${d.color}20`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: d.color, letterSpacing: "0.06em" }}>{d.label.toUpperCase()}</span>
            <span style={{ fontSize: 10, color: d.color, opacity: 0.6 }}>{d.sub}</span>
          </div>
          <p style={{ fontSize: 14, color: "#555", padding: "12px 16px", margin: 0, lineHeight: 1.6 }}>{entry[d.key] || <span style={{ color: "#ccc" }}>—</span>}</p>
        </div>
      ))}
    </div>
    <div style={{ borderTop: "1px solid #eee", paddingTop: 24 }}>
      <button onClick={() => { setUiPhase("start"); setEntry({ history:"",topic:"",interpersonal:"",goal:"" }); setSoloStep(0); setMeetingTitle(""); }} style={{ width: "100%", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1.5px solid #ddd", background: "#fff", color: "#555", fontFamily: FONT }}>
        ↩ Prepare a different meeting
      </button>
    </div>
  </>);

  // ── Join ──
  if (uiPhase === "join") return wrap(<>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>Join Meeting Preparation</h2>
    <p style={{ fontSize: 14, color: "#888", margin: "0 0 24px" }}>You've been invited to prepare together.</p>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>YOUR NAME</label>
    <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Enter your name…" autoFocus style={{ ...inputSt(), marginBottom: 12 }} />
    {joinError && <p style={{ fontSize: 13, color: "#d4537e", margin: "0 0 12px", padding: "10px 14px", background: "#d4537e10", borderRadius: 8 }}>{joinError}</p>}
    <button onClick={async () => {
      const name = nameInput.trim(); if (!name) return;
      setJoinError("");
      const s = await apiPost("join", { id: sessionId, name });
      if (!s) { setJoinError("Session not found — ask the host for a fresh link."); return; }
      setMyName(name); setSession(s);
      setUiPhase(s.phase === "filling" ? "multi-filling" : "lobby");
    }} disabled={!nameInput.trim()} style={{
      width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: nameInput.trim() ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
      background: nameInput.trim() ? COLOR : "#e8e8e8", color: nameInput.trim() ? "#fff" : "#bbb",
    }}>Join →</button>
  </>);

  // ── Multi lobby ──
  if (uiPhase === "lobby" && session) {
    const isHost = session.hostName === myName;
    return wrap(<>
      <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 4px" }}>{session.title}</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 20px" }}>Waiting room · {session.participants.length} joined</h2>
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "16px 20px", marginBottom: 16 }}>
        {session.participants.map(p => <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLOR }} />
          <span style={{ fontSize: 14, color: "#333" }}>{p.name}</span>
          {p.name === session.hostName && <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto" }}>host</span>}
        </div>)}
      </div>
      {isHost && <>
        <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 8px" }}>Share this link:</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input readOnly value={shareUrl} style={{ ...inputSt(), fontSize: 12, flex: 1 }} />
          <CopyBtn url={shareUrl} />
        </div>
        <button onClick={async () => {
          const s = await apiPost("start-filling", { id: sessionId });
          if (s) { setSession(s); setUiPhase("multi-filling"); setMultiStep(0); }
        }} disabled={session.participants.length < 2} style={{
          width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600,
          cursor: session.participants.length >= 2 ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
          background: session.participants.length >= 2 ? COLOR : "#e8e8e8",
          color: session.participants.length >= 2 ? "#fff" : "#bbb",
        }}>
          {session.participants.length < 2 ? "Waiting for more people…" : "Everyone's here — start →"}
        </button>
      </>}
      {!isHost && <p style={{ fontSize: 14, color: "#aaa", textAlign: "center" }}>Waiting for the host to start…</p>}
    </>);
  }

  // ── Multi filling ──
  if (uiPhase === "multi-filling" && session) {
    const isDone = session.participants.find(p => p.name === myName)?.done;
    if (isDone) return wrap(
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 15, color: "#888", margin: "0 0 6px" }}>Your input is in! Waiting for others…</p>
        <p style={{ fontSize: 13, color: "#bbb" }}>{session.participants.filter(p => p.done).length} / {session.participants.length} done</p>
      </div>
    );

    const dim = DIMS[multiStep];
    return wrap(<>
      <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 4px" }}>{session.title}</p>
      <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
        {DIMS.map((d, i) => <div key={d.key} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= multiStep ? d.color : "#e8e8e8" }} />)}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 4px" }}>STEP {multiStep + 1} OF 4</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: dim.color, margin: "0 0 4px" }}>{dim.label}</h2>
      <p style={{ fontSize: 12, color: "#bbb", margin: "0 0 10px", fontStyle: "italic" }}>{dim.sub}</p>
      <p style={{ fontSize: 14, color: "#666", margin: "0 0 14px", lineHeight: 1.6 }}>{dim.question}</p>
      <textarea value={multiEntry[dim.key]} onChange={e => setMultiEntry(me => ({ ...me, [dim.key]: e.target.value }))} placeholder={dim.placeholder} rows={4} autoFocus style={{ ...inputSt(4), marginBottom: 14 }} />
      <div style={{ display: "flex", gap: 10 }}>
        {multiStep > 0 && <button onClick={() => setMultiStep(s => s - 1)} style={{ padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1.5px solid #e0e0e0", background: "#fff", color: "#888", fontFamily: FONT }}>← Back</button>}
        <button onClick={async () => {
          if (multiStep < 3) { setMultiStep(s => s + 1); return; }
          const s = await apiPost("submit-entry", { id: sessionId, name: myName, entry: multiEntry });
          if (s) { setSession(s); if (s.phase === "consolidating") setUiPhase("consolidating"); }
        }} style={{ flex: 1, padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: FONT, background: dim.color, color: "#fff" }}>
          {multiStep < 3 ? "Continue →" : "Submit my preparation →"}
        </button>
      </div>
    </>);
  }

  // ── Waiting ──
  if (uiPhase === "waiting" && session) return wrap(
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ width: 48, height: 48, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize: 15, color: "#888", margin: "0 0 6px" }}>Waiting for everyone…</p>
      <p style={{ fontSize: 13, color: "#bbb" }}>{session.participants.filter(p => p.done).length} / {session.participants.length} done</p>
    </div>
  );

  // ── Consolidation ──
  if (uiPhase === "consolidating" && session) {
    const dimIdx = session.consolidation.currentDimension;
    if (dimIdx >= 4) { setUiPhase("multi-result"); return null; }
    const dim = DIMS[dimIdx];
    const isHost = session.hostName === myName;
    const consolKey = dim.key as keyof typeof session.consolidation;
    const consolValue = session.consolidation[consolKey] as string ?? "";

    return wrap(<>
      <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 4px" }}>{session.title}</p>
      <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
        {DIMS.map((d, i) => <div key={d.key} style={{ flex: 1, height: 3, borderRadius: 2, background: i < dimIdx ? d.color : i === dimIdx ? `${d.color}60` : "#e8e8e8" }} />)}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 4px" }}>DIMENSION {dimIdx + 1} OF 4 — TEAM REVIEW</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: dim.color, margin: "0 0 20px" }}>{dim.label}</h2>

      {/* All entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {session.participants.map(p => {
          const val = session.entries[p.name]?.[dim.key];
          return val ? (
            <div key={p.name} style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #eee", padding: "12px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: dim.color, margin: "0 0 4px", letterSpacing: "0.06em" }}>{p.name.toUpperCase()}</p>
              <p style={{ fontSize: 14, color: "#555", margin: 0, lineHeight: 1.6 }}>{val}</p>
            </div>
          ) : null;
        })}
      </div>

      {/* Host consolidation */}
      <div style={{ background: `${dim.color}08`, border: `1.5px solid ${dim.color}30`, borderRadius: 12, padding: "16px 18px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: dim.color, letterSpacing: "0.06em", margin: "0 0 8px" }}>
          {isHost ? "YOUR SYNTHESIS (visible to all)" : "HOST IS WRITING THE SYNTHESIS…"}
        </p>
        {isHost ? (
          <>
            <textarea
              value={consolInput || consolValue}
              onChange={async e => {
                setConsolInput(e.target.value);
                if (!consolSaving) {
                  setConsolSaving(true);
                  setTimeout(async () => {
                    await apiPost("update-consolidation", { id: sessionId, field: dim.key, value: e.target.value });
                    setConsolSaving(false);
                  }, 800);
                }
              }}
              placeholder={`Synthesize the team's perspective on ${dim.label}…`}
              rows={3}
              style={{ ...inputSt(3), marginBottom: 10 }}
            />
            <button onClick={async () => {
              await apiPost("update-consolidation", { id: sessionId, field: dim.key, value: consolInput || consolValue });
              setConsolInput("");
              const s = await apiPost("advance-consolidation", { id: sessionId });
              if (s) setSession(s);
            }} style={{ width: "100%", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: FONT, background: dim.color, color: "#fff" }}>
              {dimIdx < 3 ? `Next dimension →` : "See team preparation →"}
            </button>
          </>
        ) : (
          <p style={{ fontSize: 14, color: "#888", fontStyle: "italic", margin: 0 }}>
            {consolValue || "Waiting for host to write…"}
          </p>
        )}
      </div>
    </>);
  }

  // ── Multi result ──
  if ((uiPhase === "multi-result") && session) {
    const consolidated: MeetingEntry = {
      history:       session.consolidation.history,
      topic:         session.consolidation.topic,
      interpersonal: session.consolidation.interpersonal,
      goal:          session.consolidation.goal,
    };
    return wrap(<>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 4px" }}>TEAM PREPARATION</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: COLOR, margin: "0 0 20px" }}>{session.title}</h2>
      <MeetingDiagram entry={consolidated} title={session.title} participants={session.participants.map(p => p.name)} isTeam />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0 28px" }}>
        {DIMS.map(d => (
          <div key={d.key} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${d.color}30`, overflow: "hidden" }}>
            <div style={{ background: `${d.color}08`, borderBottom: `1px solid ${d.color}20`, padding: "8px 16px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: d.color, letterSpacing: "0.06em" }}>{d.label.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: 14, color: "#555", padding: "12px 16px", margin: 0, lineHeight: 1.6 }}>{consolidated[d.key] || <span style={{ color: "#ccc" }}>—</span>}</p>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #eee", paddingTop: 24 }}>
        <button onClick={() => setUiPhase("start")} style={{ width: "100%", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1.5px solid #ddd", background: "#fff", color: "#555", fontFamily: FONT }}>
          ↩ Prepare another meeting
        </button>
      </div>
    </>);
  }

  return null;
}

function CopyBtn({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <style>{`@keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}`}</style>
      <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
        padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
        border: `1.5px solid ${copied ? "#1d9e75" : `${COLOR}50`}`,
        background: copied ? "#1d9e7515" : `${COLOR}08`,
        color: copied ? "#1d9e75" : COLOR, fontFamily: FONT, whiteSpace: "nowrap",
        animation: copied ? "pop 0.25s ease" : "none",
      }}>{copied ? "Copied ✓" : "Copy →"}</button>
    </>
  );
}

export default function MeetingPrepPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f7f7f5" }} />}>
      <MeetingPrepInner />
    </Suspense>
  );
}
