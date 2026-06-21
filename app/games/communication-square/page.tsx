"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Session, ParticipantAnalysis } from "@/lib/sessionStore";

// ── Constants ─────────────────────────────────────────────────────────────────

const EAR_META = {
  fact:         { label: "Fact",            color: "#378add", bg: "#eaf3fb" },
  self:         { label: "Self-disclosure", color: "#e07a3a", bg: "#fdf0e8" },
  relationship: { label: "Relationship",    color: "#d4537e", bg: "#fceef4" },
  appeal:       { label: "Appeal",          color: "#1d9e75", bg: "#e8f5f0" },
} as const;

type EarKey = keyof typeof EAR_META;
const EAR_KEYS: EarKey[] = ["fact", "self", "relationship", "appeal"];
const PARTICIPANT_COLORS = ["#7c6fcd","#e07a3a","#d4537e","#378add","#639922","#1d9e75"];

function generateId() { return Math.random().toString(36).slice(2, 10); }

// ── Shared styles ─────────────────────────────────────────────────────────────

function inputStyle(override?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%", fontSize: 15, padding: "13px 16px",
    border: "1.5px solid #e0e0e0", borderRadius: 12, outline: "none",
    boxSizing: "border-box", color: "#111", fontFamily: "inherit",
    background: "#fff", ...override,
  };
}

function btnStyle(color: string, outline = false, disabled = false): React.CSSProperties {
  return {
    padding: "12px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: outline ? `1.5px solid ${disabled ? "#ddd" : color}` : "none",
    background: outline ? "transparent" : (disabled ? "#e8e8e8" : color),
    color: disabled ? "#bbb" : (outline ? color : "#fff"),
  };
}

// ── Solo analysis types ───────────────────────────────────────────────────────

interface EarResult { percent: number; label: string; insight: string; }
type Analysis = Record<EarKey, EarResult>;
type Alternatives = Record<EarKey, string>;
type Questions = Record<EarKey, string>;

// ── Main component ────────────────────────────────────────────────────────────

export default function CommunicationSquarePage() {
  const [sessionId, setSessionId] = useState("");
  const [myName, setMyName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [session, setSession] = useState<Session | null>(null);

  // Solo state
  const [messageInput, setMessageInput] = useState("");
  const [interpretationInput, setInterpretationInput] = useState("");
  const [soloAnalysis, setSoloAnalysis] = useState<Analysis | null>(null);
  const [soloAlternatives, setSoloAlternatives] = useState<Alternatives | null>(null);
  const [soloQuestions, setSoloQuestions] = useState<Questions | null>(null);
  const [soloLoading, setSoloLoading] = useState(false);
  const [altLoading, setAltLoading] = useState(false);
  const [qLoading, setQLoading] = useState(false);

  // Multiplayer state
  const [mpInterpretation, setMpInterpretation] = useState("");
  const [mpSubmitting, setMpSubmitting] = useState(false);
  const [mpMessageInput, setMpMessageInput] = useState("");
  const [mpMode, setMpMode] = useState<"general" | "situation">("general");
  const [mpSpeakerName, setMpSpeakerName] = useState("");
  const [mpSituationContext, setMpSituationContext] = useState("");

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [preCheckDone, setPreCheckDone] = useState(false);
  const [isSoloLocked, setIsSoloLocked] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Init session ID from URL + pre-check if solo-locked + auto-join from ?name= param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session") || generateId();
    const autoName = params.get("name");
    setSessionId(sid);
    if (!params.get("session")) {
      window.history.replaceState({}, "", `?session=${sid}`);
      setPreCheckDone(true);
    } else {
      fetch(`/api/session/${sid}`)
        .then(r => r.ok ? r.json() : null)
        .then(async s => {
          if (s?.soloLocked) { setIsSoloLocked(true); setPreCheckDone(true); return; }
          // Auto-join when coming from a "new round" link (?name=...)
          if (autoName && s) {
            const action = s.participants[autoName] ? "join" : "join";
            await fetch(`/api/session/${sid}`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action, name: autoName }),
            });
            setMyName(autoName);
            // Clean the name param from URL
            const clean = new URLSearchParams(window.location.search);
            clean.delete("name");
            window.history.replaceState({}, "", `?${clean.toString()}`);
          }
          setPreCheckDone(true);
        })
        .catch(() => setPreCheckDone(true));
    }
  }, []);

  // Poll session state
  const poll = useCallback(async (sid: string) => {
    const res = await fetch(`/api/session/${sid}`);
    if (res.ok) setSession(await res.json());
  }, []);

  useEffect(() => {
    if (!sessionId || !myName) return;
    poll(sessionId);
    pollRef.current = setInterval(() => poll(sessionId), 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, myName, poll]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleJoin() {
    if (!nameInput.trim() || !sessionId) return;
    const name = nameInput.trim();
    const existing = await fetch(`/api/session/${sessionId}`);
    const action = existing.ok ? "join" : "create";
    const res = await fetch(`/api/session/${sessionId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, name }),
    });
    setSession(await res.json());
    setMyName(name);
  }

  async function handleSoloAnalyze() {
    if (!messageInput.trim() || !interpretationInput.trim()) return;
    setSoloLoading(true);
    setSoloAlternatives(null);
    setSoloQuestions(null);
    // Lock this session so nobody can join and turn it multiplayer
    await fetch(`/api/session/${sessionId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lock-solo" }),
    });
    try {
      const res = await fetch("/api/games/communication-square/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageInput.trim(), interpretation: interpretationInput.trim() }),
      });
      setSoloAnalysis(await res.json());
    } finally { setSoloLoading(false); }
  }

  async function handleSoloAlternatives() {
    setAltLoading(true);
    try {
      const res = await fetch("/api/games/communication-square/alternatives", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageInput.trim() }),
      });
      setSoloAlternatives(await res.json());
    } finally { setAltLoading(false); }
  }

  async function handleSoloQuestions() {
    setQLoading(true);
    try {
      const res = await fetch("/api/games/communication-square/questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageInput.trim(), interpretation: interpretationInput.trim() }),
      });
      setSoloQuestions(await res.json());
    } finally { setQLoading(false); }
  }

  function handleEditInterpretation() {
    setSoloAnalysis(null);
    setSoloAlternatives(null);
    setSoloQuestions(null);
  }

  async function handleMpSetMessage() {
    if (!mpMessageInput.trim()) return;
    if (mpMode === "situation" && !mpSpeakerName) return;
    const res = await fetch(`/api/session/${sessionId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set-message",
        message: mpMessageInput.trim(),
        mode: mpMode,
        speakerName: mpMode === "situation" ? mpSpeakerName : undefined,
        situationContext: mpMode === "situation" && mpSituationContext.trim() ? mpSituationContext.trim() : undefined,
      }),
    });
    setSession(await res.json());
  }

  async function handleMpSubmit() {
    if (!mpInterpretation.trim()) return;
    setMpSubmitting(true);
    const res = await fetch(`/api/session/${sessionId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", name: myName, interpretation: mpInterpretation.trim() }),
    });
    setSession(await res.json());
    setMpSubmitting(false);
  }

  async function handleMpQuestions() {
    const res = await fetch(`/api/session/${sessionId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "questions" }),
    });
    setSession(await res.json());
  }

  async function handleRestart() {
    const res = await fetch(`/api/session/${sessionId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restart", name: myName }),
    });
    const { newSessionId } = await res.json();
    const base = window.location.pathname;
    window.open(`${base}?session=${newSessionId}&name=${encodeURIComponent(myName)}`, "_blank");
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  async function downloadImage() {
    if (!resultRef.current) return;
    setDownloading(true);
    try {
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(resultRef.current, { backgroundColor: "#f7f7f5", scale: 2, useCORS: true });
      const a = document.createElement("a");
      a.download = `communication-square-${sessionId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally { setDownloading(false); }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const participants = session ? Object.values(session.participants) : [];
  const isMultiplayer = participants.length >= 2;
  const isCreator = session?.creatorName === myName;
  const myParticipant = session?.participants[myName];
  const doneCount = participants.filter(p => p.done).length;
  const isManyPeople = participants.length > 3;

  // ── Layout helpers ────────────────────────────────────────────────────────

  const pageWrap = (children: React.ReactNode) => (
    <div style={{
      minHeight: "100vh", background: "#f7f7f5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
        background: "#fff", borderBottom: "1px solid #eee",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← CommLab</Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Communication Square</span>
        {myName
          ? <button onClick={copyLink} style={btnStyle(copied ? "#1d9e75" : "#111")}>{copied ? "Copied!" : "Share link"}</button>
          : <span />}
      </div>
      <div style={{ paddingTop: 52 }}>{children}</div>
    </div>
  );

  const narrowCard = (children: React.ReactNode) => (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "56px 24px" }}>{children}</div>
  );

  const sectionLabel = (text: string) => (
    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 8px" }}>{text}</p>
  );

  // ── PRE-CHECK LOADING ─────────────────────────────────────────────────────

  if (!preCheckDone) return pageWrap(narrowCard(
    <p style={{ color: "#aaa" }}>Loading…</p>
  ));

  // ── SOLO-LOCKED — shown to anyone who opens a link after analysis started ──

  if (isSoloLocked) return pageWrap(narrowCard(
    <>
      <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 12px" }}>
        Solo game in progress
      </h2>
      <p style={{ fontSize: 15, color: "#555", lineHeight: 1.6, margin: "0 0 24px" }}>
        This game was started as a solo session and is already locked.
        Ask the session starter to begin a new session if you&apos;d like to play together.
      </p>
      <Link href="/" style={{ ...btnStyle("#111") as React.CSSProperties, display: "inline-block", textDecoration: "none" }}>
        ← Back to CommLab
      </Link>
    </>
  ));

  // ── NAME ENTRY ────────────────────────────────────────────────────────────

  if (!myName) return pageWrap(narrowCard(
    <>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.6px", color: "#111", margin: "0 0 8px" }}>
        Communication Square
      </h1>
      <p style={{ fontSize: 15, color: "#888", margin: "0 0 36px", lineHeight: 1.5 }}>
        Decode what was really said — and what was really heard.
      </p>
      {sectionLabel("YOUR NAME")}
      <input
        autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleJoin()}
        placeholder="Enter your name" style={inputStyle()}
      />
      <button
        onClick={handleJoin} disabled={!nameInput.trim()}
        style={{ ...btnStyle("#111", false, !nameInput.trim()), marginTop: 14, width: "100%" }}
      >
        Start →
      </button>
    </>
  ));

  if (!session) return pageWrap(narrowCard(<p style={{ color: "#aaa" }}>Connecting…</p>));

  // ── MULTIPLAYER — LOBBY ───────────────────────────────────────────────────

  if (isMultiplayer && session.phase === "lobby") return pageWrap(narrowCard(
    <>
      {sectionLabel("WAITING ROOM")}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "16px 20px", marginBottom: 20 }}>
        {participants.map(p => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1d9e75", flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: "#111" }}>{p.name}{p.name === session.creatorName ? " (host)" : ""}</span>
          </div>
        ))}
      </div>
      <button onClick={copyLink} style={{ ...btnStyle("#111", true), width: "100%", marginBottom: 16 }}>
        {copied ? "Link copied!" : "Copy invite link"}
      </button>
      {isCreator && (
        <>
          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => setMpMode("general")}
              style={{ ...btnStyle(mpMode === "general" ? "#111" : "#999", mpMode !== "general"), flex: 1, fontSize: 13 }}
            >
              General analysis
            </button>
            <button
              onClick={() => setMpMode("situation")}
              style={{ ...btnStyle(mpMode === "situation" ? "#7c6fcd" : "#999", mpMode !== "situation"), flex: 1, fontSize: 13 }}
            >
              Situation analysis
            </button>
          </div>

          {/* Situation mode: speaker picker + context */}
          {mpMode === "situation" && (
            <div style={{ background: "#f7f4ff", border: "1px solid #7c6fcd22", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                {sectionLabel("WHO SAID IT?")}
                <select
                  value={mpSpeakerName}
                  onChange={e => setMpSpeakerName(e.target.value)}
                  style={{ ...inputStyle(), appearance: "none", cursor: "pointer" }}
                >
                  <option value="">— Select a participant —</option>
                  {participants.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                {sectionLabel("SITUATION / CONTEXT")}
                <input
                  value={mpSituationContext}
                  onChange={e => setMpSituationContext(e.target.value)}
                  placeholder="e.g. Friday evening in the planning meeting"
                  style={inputStyle()}
                />
              </div>
            </div>
          )}

          {sectionLabel("THE MESSAGE")}
          <textarea
            value={mpMessageInput} onChange={e => setMpMessageInput(e.target.value)}
            placeholder={mpMode === "situation" ? "What did they say exactly?" : "Paste the message the group will analyse…"}
            rows={4} style={{ ...inputStyle(), resize: "none", lineHeight: 1.6 }}
          />
          <button
            onClick={handleMpSetMessage}
            disabled={!mpMessageInput.trim() || (mpMode === "situation" && !mpSpeakerName)}
            style={{ ...btnStyle("#111", false, !mpMessageInput.trim() || (mpMode === "situation" && !mpSpeakerName)), marginTop: 12, width: "100%" }}
          >
            Start the session →
          </button>
        </>
      )}
      {!isCreator && (
        <p style={{ fontSize: 14, color: "#aaa", textAlign: "center", marginTop: 8 }}>
          Waiting for the host to set a message…
        </p>
      )}
    </>
  ));

  // ── MULTIPLAYER — COLLECTING ──────────────────────────────────────────────

  const iAmSpeaker = session?.speakerName === myName;

  if (isMultiplayer && session.phase === "collecting") return pageWrap(narrowCard(
    <>
      {/* Message */}
      {sectionLabel("MESSAGE")}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "14px 18px", fontSize: 15, color: "#333", lineHeight: 1.6, marginBottom: session.situationContext ? 10 : 28 }}>
        &ldquo;{session.message}&rdquo;
      </div>

      {/* Context (situation mode) */}
      {session.situationContext && (
        <div style={{ background: "#f7f4ff", border: "1px solid #7c6fcd22", borderRadius: 10, padding: "10px 14px", marginBottom: 28, fontSize: 13, color: "#666" }}>
          <span style={{ fontWeight: 600, color: "#7c6fcd" }}>Context: </span>{session.situationContext}
        </div>
      )}

      {/* Speaker badge */}
      {iAmSpeaker && (
        <div style={{ background: "#fff8e8", border: "1px solid #e07a3a30", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#e07a3a" }}>
          You said this. Tell the group what you <strong>meant</strong> by it.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        {sectionLabel(iAmSpeaker ? "WHAT DID YOU MEAN?" : "HOW DID YOU UNDERSTAND IT?")}
        <span style={{ fontSize: 12, color: "#bbb" }}>{doneCount}/{participants.length} submitted</span>
      </div>

      {myParticipant?.done ? (
        <div style={{ background: "#e8f5f0", border: "1px solid #1d9e7530", borderRadius: 12, padding: "16px 20px", color: "#1d9e75", fontSize: 14 }}>
          ✓ Submitted. Waiting for others…
        </div>
      ) : (
        <>
          <textarea
            autoFocus value={mpInterpretation} onChange={e => setMpInterpretation(e.target.value)}
            placeholder={iAmSpeaker
              ? "What did you want to say? What was your intention?"
              : "Describe in your own words what you took from this message…"}
            rows={4} style={{ ...inputStyle(), resize: "none", lineHeight: 1.6 }}
          />
          <button
            onClick={handleMpSubmit} disabled={!mpInterpretation.trim() || mpSubmitting}
            style={{ ...btnStyle("#111", false, !mpInterpretation.trim() || mpSubmitting), marginTop: 12, width: "100%" }}
          >
            {mpSubmitting ? "Submitting…" : "Done →"}
          </button>
        </>
      )}
    </>
  ));

  // ── MULTIPLAYER — ANALYZING ───────────────────────────────────────────────

  if (isMultiplayer && session.phase === "analyzing") return pageWrap(narrowCard(
    <div style={{ textAlign: "center", paddingTop: 40 }}>
      <p style={{ fontSize: 15, color: "#888" }}>Analysing all interpretations…</p>
    </div>
  ));

  // ── MULTIPLAYER — RESULTS + QUESTIONS ────────────────────────────────────

  if (isMultiplayer && (session.phase === "results" || session.phase === "questions")) {
    const gridCols = isManyPeople ? "repeat(4, minmax(0,1fr))" : "1fr 1fr";
    return pageWrap(
      <div ref={resultRef} style={{ maxWidth: isManyPeople ? 1100 : 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: 24 }}>
          {sectionLabel("MESSAGE ANALYSED")}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "14px 18px", fontSize: 15, color: "#333", lineHeight: 1.6 }}>
            &ldquo;{session.message}&rdquo;
          </div>
          {session.situationContext && (
            <div style={{ background: "#f7f4ff", border: "1px solid #7c6fcd22", borderRadius: 10, padding: "10px 14px", marginTop: 8, fontSize: 13, color: "#666" }}>
              <span style={{ fontWeight: 600, color: "#7c6fcd" }}>Context: </span>{session.situationContext}
            </div>
          )}
          {session.speakerName && (
            <p style={{ fontSize: 12, color: "#999", margin: "6px 0 0" }}>
              Speaker: <strong style={{ color: "#e07a3a" }}>{session.speakerName}</strong> — their column shows sender intent
            </p>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12 }}>
          {EAR_KEYS.map(key => {
            const meta = EAR_META[key];
            return (
              <div key={key} style={{ background: "#fff", borderRadius: 16, border: `1px solid ${meta.color}22`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 4, background: meta.color }} />
                {/* Participants */}
                <div style={{ padding: "18px 18px 20px", flexGrow: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: "0.08em", margin: "0 0 14px" }}>
                    {meta.label.toUpperCase()}
                  </p>
                  {participants.map((p, i) => {
                    const a = p.analysis as ParticipantAnalysis | undefined;
                    if (!a) return null;
                    const ear = a[key];
                    const isSpeaker = p.role === "speaker";
                    const col = isSpeaker ? "#e07a3a" : PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
                    return (
                      <div key={p.name} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: col }}>{p.name}</span>
                            {isSpeaker && (
                              <span style={{ fontSize: 9, fontWeight: 700, background: "#fff0e4", color: "#e07a3a", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.06em" }}>
                                SENDER
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 700, color: col }}>{ear.percent}%</span>
                        </div>
                        <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, marginBottom: 6 }}>
                          <div style={{ height: 3, width: `${ear.percent}%`, background: col, borderRadius: 2 }} />
                        </div>
                        <p style={{ fontSize: 12, color: "#666", lineHeight: 1.55, margin: 0 }}>{ear.insight}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Discuss — always pinned to card bottom */}
                {(() => {
                  const percents = participants.map(p => (p.analysis as ParticipantAnalysis)?.[key]?.percent ?? 0);
                  const max = Math.max(...percents), min = Math.min(...percents);
                  return (
                    <div style={{ background: "#f4f4f4", padding: "12px 18px 14px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: "0.09em", margin: "0 0 4px" }}>
                        DISCUSS
                      </p>
                      <p style={{ fontSize: 12, color: "#555", lineHeight: 1.5, margin: 0 }}>
                        {max - min > 25
                          ? `Big spread (${min}%–${max}%) — what made the difference?`
                          : `Similar readings (${min}%–${max}%) — do you agree?`}
                      </p>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
        {session.phase === "questions" && session.questions && (
          <div style={{ marginTop: 16 }}>
            {sectionLabel("CLARIFYING QUESTIONS FOR THE SENDER")}
            <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12 }}>
              {EAR_KEYS.map(key => {
                const meta = EAR_META[key];
                return (
                  <div key={key} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${meta.color}22`, padding: "16px 18px" }}>
                    <div style={{ height: 3, background: meta.color, borderRadius: 2, marginBottom: 10 }} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: "0.07em", margin: "0 0 8px" }}>
                      {meta.label.toUpperCase()}
                    </p>
                    <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                      &ldquo;{session.questions![key]}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          {session.phase === "results" && isCreator && (
            <button onClick={handleMpQuestions} style={btnStyle("#7c6fcd")}>
              Clarifying questions →
            </button>
          )}
          <button onClick={downloadImage} disabled={downloading} style={btnStyle("#111", true, downloading)}>
            {downloading ? "Saving…" : "⬇ Save as image"}
          </button>
          <button onClick={handleRestart} style={btnStyle("#1d9e75")}>
            New round →
          </button>
        </div>

        {/* Banner for others when someone already started a new round */}
        {session.nextSessionId && session.nextSessionStarter !== myName && (
          <div style={{ marginTop: 20, background: "#e8f5f0", border: "1px solid #1d9e7540", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1d9e75", margin: "0 0 2px" }}>A new round has been started!</p>
              <p style={{ fontSize: 12, color: "#555", margin: 0 }}>Click to join with your name and analyse a new message.</p>
            </div>
            <a
              href={`${typeof window !== "undefined" ? window.location.pathname : ""  }?session=${session.nextSessionId}&name=${encodeURIComponent(myName)}`}
              target="_blank"
              rel="noreferrer"
              style={{ ...btnStyle("#1d9e75") as React.CSSProperties, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Join new round →
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── SOLO — INPUT ──────────────────────────────────────────────────────────

  if (!soloAnalysis) return pageWrap(narrowCard(
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
        Hi {myName}
      </h2>
      <p style={{ fontSize: 14, color: "#888", margin: "0 0 28px", lineHeight: 1.5 }}>
        Enter the message you received and how you understood it.
      </p>
      {sectionLabel("THE MESSAGE")}
      <textarea
        autoFocus value={messageInput} onChange={e => setMessageInput(e.target.value)}
        placeholder='What was said to you? (e.g. "He can&apos;t do Friday.")'
        rows={3} style={{ ...inputStyle(), resize: "none", lineHeight: 1.6, marginBottom: 20 }}
      />
      {sectionLabel("YOUR INTERPRETATION")}
      <textarea
        value={interpretationInput} onChange={e => setInterpretationInput(e.target.value)}
        placeholder="How did you understand it? What did you take from it?"
        rows={3} style={{ ...inputStyle(), resize: "none", lineHeight: 1.6 }}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button
          onClick={handleSoloAnalyze}
          disabled={!messageInput.trim() || !interpretationInput.trim() || soloLoading}
          style={btnStyle("#111", false, !messageInput.trim() || !interpretationInput.trim() || soloLoading)}
        >
          {soloLoading ? "Analysing…" : "Analyse →"}
        </button>
        <button onClick={copyLink} style={btnStyle("#999", true)}>
          {copied ? "Copied!" : "Invite someone"}
        </button>
      </div>
      <p style={{ fontSize: 12, color: "#bbb", margin: "10px 0 0", lineHeight: 1.5 }}>
        Share the link to play together — the game switches to multiplayer when someone joins.
      </p>
    </>
  ));

  // ── SOLO — RESULTS ────────────────────────────────────────────────────────

  return pageWrap(
    <div ref={resultRef} style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        <div>
          {sectionLabel("MESSAGE")}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "14px 16px", fontSize: 14, color: "#333", lineHeight: 1.6 }}>
            &ldquo;{messageInput}&rdquo;
          </div>
        </div>
        <div>
          {sectionLabel("YOUR INTERPRETATION")}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "14px 16px", fontSize: 14, color: "#333", lineHeight: 1.6 }}>
            {interpretationInput}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {EAR_KEYS.map(key => {
          const meta = EAR_META[key];
          const ear = soloAnalysis![key];
          const alt = soloAlternatives?.[key];
          const q = soloQuestions?.[key];
          return (
            <div key={key} style={{ background: "#fff", borderRadius: 16, border: `1px solid ${meta.color}22`, overflow: "hidden" }}>
              <div style={{ height: 4, background: meta.color }} />
              <div style={{ padding: "18px 20px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: "0.08em" }}>
                    {meta.label.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: meta.color }}>{ear.percent}%</span>
                </div>
                <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3, marginBottom: 12 }}>
                  <div style={{ height: 5, width: `${ear.percent}%`, background: meta.color, borderRadius: 3 }} />
                </div>
                <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0 }}>{ear.insight}</p>
                {alt && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${meta.color}22` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: "0.07em", margin: "0 0 5px" }}>
                      COULD ALSO MEAN
                    </p>
                    <p style={{ fontSize: 12, color: "#666", lineHeight: 1.55, margin: 0 }}>{alt}</p>
                  </div>
                )}
                {q && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${meta.color}22` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: "0.07em", margin: "0 0 5px" }}>
                      ASK TO CLARIFY
                    </p>
                    <p style={{ fontSize: 12, color: "#444", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>
                      &ldquo;{q}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button onClick={handleEditInterpretation} style={btnStyle("#111", true)}>
          Edit my interpretation
        </button>
        {!soloAlternatives && (
          <button onClick={handleSoloAlternatives} disabled={altLoading} style={btnStyle("#7c6fcd", false, altLoading)}>
            {altLoading ? "Loading…" : "How else could it be understood?"}
          </button>
        )}
        {soloAlternatives && !soloQuestions && (
          <button onClick={handleSoloQuestions} disabled={qLoading} style={btnStyle("#1d9e75", false, qLoading)}>
            {qLoading ? "Loading…" : "Clarifying questions"}
          </button>
        )}
        <button onClick={downloadImage} disabled={downloading} style={btnStyle("#111", true, downloading)}>
          {downloading ? "Saving…" : "⬇ Save as image"}
        </button>
      </div>
    </div>
  );
}
