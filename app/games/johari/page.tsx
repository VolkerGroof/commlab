"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { JohariSession } from "@/lib/johariStore";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLOR = "#e67e22";
const FONT  = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const PRESET_CATEGORIES = [
  "Leadership & Influence",
  "Communication & Listening",
  "Teamwork & Collaboration",
  "Problem-solving & Innovation",
  "Reliability & Follow-through",
  "Emotional Intelligence",
  "Conflict Handling",
  "Decision-making",
];

const QUADRANTS = {
  open:    { label: "Open / Arena",  color: "#1d9e75", bg: "#1d9e7512", desc: "Known to self & others" },
  blind:   { label: "Blind Spot",    color: "#d4537e", bg: "#d4537e12", desc: "Unknown to self, known to others" },
  hidden:  { label: "Hidden / Facade", color: "#378add", bg: "#378add12", desc: "Known to self, unknown to others" },
  unknown: { label: "Unknown",       color: "#999",    bg: "#f5f5f5",   desc: "Unknown to self & others" },
};

// ── Style helpers ─────────────────────────────────────────────────────────────

function inputSt(): React.CSSProperties {
  return {
    width: "100%", fontSize: 15, padding: "12px 16px", border: "1.5px solid #e0e0e0",
    borderRadius: 12, outline: "none", boxSizing: "border-box", color: "#111",
    fontFamily: FONT, background: "#fff",
  };
}

function wrap(content: React.ReactNode) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: FONT }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #eee", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← CommLab</Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Johari Window</span>
        <span />
      </div>
      <div style={{ paddingTop: 52 }}>
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "48px 24px 80px" }}>
          {content}
        </div>
      </div>
    </div>
  );
}

// ── Johari diagram ────────────────────────────────────────────────────────────

function JohariDiagram({ question, selfYes, othersYes, othersCount }: {
  question: string; selfYes: boolean; othersYes: boolean; othersCount: number;
}) {
  const quad = selfYes
    ? (othersYes ? "open" : "hidden")
    : (othersYes ? "blind" : "unknown");
  const q = QUADRANTS[quad];

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "18px 20px", marginBottom: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#555", margin: "0 0 14px", lineHeight: 1.4 }}>{question}</p>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gridTemplateRows: "28px 1fr 1fr", gap: 3 }}>
        {/* Header labels */}
        <div />
        <div style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center" }}>KNOWN TO OTHERS</div>
        <div style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center" }}>UNKNOWN TO OTHERS</div>
        {/* Row 1 */}
        <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", display: "flex", alignItems: "center", writingMode: "vertical-rl", transform: "rotate(180deg)", justifyContent: "center" }}>KNOWN TO SELF</div>
        <div style={{ background: quad === "open" ? q.bg : "#fafafa", border: `2px solid ${quad === "open" ? q.color : "#e8e8e8"}`, borderRadius: 10, padding: 12, minHeight: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: quad === "open" ? q.color : "#ccc" }}>{QUADRANTS.open.label}</span>
          {quad === "open" && <span style={{ fontSize: 18, marginTop: 4 }}>●</span>}
        </div>
        <div style={{ background: quad === "hidden" ? q.bg : "#fafafa", border: `2px solid ${quad === "hidden" ? q.color : "#e8e8e8"}`, borderRadius: 10, padding: 12, minHeight: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: quad === "hidden" ? q.color : "#ccc" }}>{QUADRANTS.hidden.label}</span>
          {quad === "hidden" && <span style={{ fontSize: 18, marginTop: 4 }}>●</span>}
        </div>
        {/* Row 2 */}
        <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", display: "flex", alignItems: "center", writingMode: "vertical-rl", transform: "rotate(180deg)", justifyContent: "center" }}>UNKNOWN TO SELF</div>
        <div style={{ background: quad === "blind" ? q.bg : "#fafafa", border: `2px solid ${quad === "blind" ? q.color : "#e8e8e8"}`, borderRadius: 10, padding: 12, minHeight: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: quad === "blind" ? q.color : "#ccc" }}>{QUADRANTS.blind.label}</span>
          {quad === "blind" && <span style={{ fontSize: 18, marginTop: 4 }}>●</span>}
        </div>
        <div style={{ background: quad === "unknown" ? q.bg : "#fafafa", border: `2px solid ${quad === "unknown" ? q.color : "#e8e8e8"}`, borderRadius: 10, padding: 12, minHeight: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: quad === "unknown" ? q.color : "#ccc" }}>{QUADRANTS.unknown.label}</span>
          {quad === "unknown" && <span style={{ fontSize: 18, marginTop: 4 }}>●</span>}
        </div>
      </div>
      <div style={{ marginTop: 12, padding: "8px 12px", background: `${q.color}10`, borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>●</span>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: q.color }}>{q.label}</span>
          <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>{q.desc}</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "#aaa", margin: "8px 0 0" }}>
        You: <strong>{selfYes ? "Yes" : "No"}</strong> · Others ({othersCount}): <strong>{othersYes ? "Majority Yes" : "Majority No"}</strong>
      </p>
    </div>
  );
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function api(action: string, data: Record<string, unknown>) {
  const res = await fetch("/api/games/johari/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return res.json() as Promise<JohariSession>;
}

async function poll(id: string): Promise<JohariSession | null> {
  const res = await fetch(`/api/games/johari/session?id=${id}`);
  if (!res.ok) return null;
  return res.json();
}

// ── Main inner ────────────────────────────────────────────────────────────────

function JohariInner() {
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("s");

  // Local state
  const [sessionId, setSessionId] = useState(urlSessionId ?? "");
  const [myName, setMyName]       = useState("");
  const [nameInput, setNameInput] = useState("");
  const [session, setSession]     = useState<JohariSession | null>(null);
  const [uiPhase, setUiPhase]     = useState<"landing"|"join"|"lobby"|"setup"|"assessing"|"results">(
    urlSessionId ? "join" : "landing"
  );

  // Setup state
  const [category, setCategory]     = useState("");
  const [customCat, setCustomCat]   = useState("");
  const [generating, setGenerating] = useState(false);

  // Rating state
  // For each question (0-4), for each ratee name: true/false | null (not rated yet)
  const [ratings, setRatings] = useState<Record<string, boolean[]>>({});
  // Current position in carousel: [questionIdx, rateeIdx]
  const [ratingPos, setRatingPos] = useState([0, 0]); // [q, personIdx]
  const [submitting, setSubmitting] = useState(false);

  // Poll session
  const pollSession = useCallback(async () => {
    if (!sessionId) return;
    const s = await poll(sessionId);
    if (s) {
      setSession(s);
      if (s.phase === "assessing" && uiPhase === "lobby") setUiPhase("assessing");
      if (s.phase === "assessing" && uiPhase === "setup")  setUiPhase("assessing");
      if (s.phase === "results")  setUiPhase("results");
    }
  }, [sessionId, uiPhase]);

  useEffect(() => {
    if (!sessionId || uiPhase === "landing" || uiPhase === "join" || uiPhase === "results") return;
    const t = setInterval(pollSession, 3000);
    return () => clearInterval(t);
  }, [sessionId, uiPhase, pollSession]);

  // ── Create session ──
  async function handleCreate() {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    const s = await api("create", { name });
    setMyName(name);
    setSessionId(s.id);
    setSession(s);
    setUiPhase("lobby");
  }

  // ── Join session ──
  const [joinError, setJoinError] = useState("");
  async function handleJoin() {
    if (!nameInput.trim() || !sessionId) return;
    setJoinError("");
    const name = nameInput.trim();
    try {
      const res = await fetch("/api/games/johari/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", id: sessionId, name }),
      });
      if (!res.ok) {
        setJoinError("Session not found — ask the host to share a fresh link.");
        return;
      }
      const s: JohariSession = await res.json();
      setMyName(name);
      setSession(s);
      setUiPhase(s.phase === "assessing" ? "assessing" : "lobby");
    } catch {
      setJoinError("Could not connect. Please try again.");
    }
  }

  // ── Start setup (starter only) ──
  async function handleStartSetup() {
    const s = await api("start-setup", { id: sessionId });
    setSession(s);
    setUiPhase("setup");
  }

  // ── Generate questions & start assessing ──
  async function handleGenerateQuestions() {
    const cat = category === "__custom__" ? customCat.trim() : category;
    if (!cat) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/games/johari/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat }),
      });
      const { questions } = await res.json();
      const s = await api("set-questions", { id: sessionId, category: cat, questions });
      setSession(s);
      // Init ratings for all participants
      const ratees: Record<string, boolean[]> = {};
      s.participants.forEach(p => { ratees[p.name] = []; });
      setRatings(ratees);
      setRatingPos([0, 0]);
      setUiPhase("assessing");
    } finally { setGenerating(false); }
  }

  // ── Rate one person on current question ──
  function handleRate(answer: boolean) {
    if (!session) return;
    const [qi, pi] = ratingPos;
    const allPeople = session.participants.map(p => p.name);
    const rateeName = allPeople[pi];

    setRatings(prev => {
      const arr = [...(prev[rateeName] ?? [])];
      arr[qi] = answer;
      return { ...prev, [rateeName]: arr };
    });

    // Advance
    const nextPi = pi + 1;
    if (nextPi < allPeople.length) {
      setRatingPos([qi, nextPi]);
    } else {
      const nextQi = qi + 1;
      if (nextQi < (session.questions?.length ?? 5)) {
        setRatingPos([nextQi, 0]);
      } else {
        // All done — submit
        submitRatings({ ...ratings, [rateeName]: (() => { const a = [...(ratings[rateeName] ?? [])]; a[qi] = answer; return a; })() });
      }
    }
  }

  async function submitRatings(finalRatings: Record<string, boolean[]>) {
    setSubmitting(true);
    const s = await api("submit-ratings", { id: sessionId, rater: myName, ratings: finalRatings });
    setSession(s);
    setUiPhase("results");
    setSubmitting(false);
  }

  // ── Compute results for myName ──
  function computeResults(): { question: string; selfYes: boolean; othersYes: boolean; othersCount: number }[] {
    if (!session) return [];
    const others = session.participants.filter(p => p.name !== myName);
    return session.questions.map((q, qi) => {
      const selfYes = session.ratings[myName]?.[myName]?.[qi] ?? false;
      let yesCount = 0;
      others.forEach(o => {
        if (session.ratings[o.name]?.[myName]?.[qi]) yesCount++;
      });
      const othersYes = others.length > 0 && yesCount > others.length / 2;
      return { question: q.replace(/\[name\]/gi, "you"), selfYes, othersYes, othersCount: others.length };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/games/johari?s=${sessionId}` : "";

  // ── Landing ──
  if (uiPhase === "landing") return wrap(<>
    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>Johari Window</h1>
    <p style={{ fontSize: 15, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
      Discover what you know about yourself — and what others see that you don't. A shared assessment for teams.
    </p>
    <div style={{ background: `${COLOR}10`, border: `1.5px solid ${COLOR}30`, borderRadius: 14, padding: "18px 20px", marginBottom: 28 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: COLOR, letterSpacing: "0.06em", margin: "0 0 10px" }}>HOW IT WORKS</p>
      {[
        "Create a session and share the link with your team",
        "Choose a work-relevant category — AI generates 5 questions",
        "Each person rates themselves AND their teammates on each question",
        "Everyone gets 5 personal Johari Window diagrams",
      ].map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLOR, minWidth: 18 }}>{i + 1}</span>
          <span style={{ fontSize: 13, color: "#666" }}>{s}</span>
        </div>
      ))}
    </div>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>YOUR NAME</label>
    <input value={nameInput} onChange={e => setNameInput(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter" && nameInput.trim()) handleCreate(); }}
      placeholder="Enter your name…" style={{ ...inputSt(), marginBottom: 14 }} />
    <button onClick={handleCreate} disabled={!nameInput.trim()} style={{
      width: "100%", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: nameInput.trim() ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
      background: nameInput.trim() ? COLOR : "#e8e8e8", color: nameInput.trim() ? "#fff" : "#bbb",
    }}>
      Create session →
    </button>
  </>);

  // ── Join ──
  if (uiPhase === "join") return wrap(<>
    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>Join Johari Session</h1>
    <p style={{ fontSize: 14, color: "#888", margin: "0 0 24px" }}>You've been invited. Enter your name to join.</p>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>YOUR NAME</label>
    <input value={nameInput} onChange={e => setNameInput(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter" && nameInput.trim()) handleJoin(); }}
      placeholder="Enter your name…" style={{ ...inputSt(), marginBottom: 14 }} autoFocus />
    {joinError && (
      <p style={{ fontSize: 13, color: "#d4537e", margin: "0 0 12px", padding: "10px 14px", background: "#d4537e10", borderRadius: 8 }}>
        {joinError}
      </p>
    )}
    <button onClick={handleJoin} disabled={!nameInput.trim()} style={{
      width: "100%", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: nameInput.trim() ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
      background: nameInput.trim() ? COLOR : "#e8e8e8", color: nameInput.trim() ? "#fff" : "#bbb",
    }}>
      Join →
    </button>
  </>);

  // ── Lobby ──
  if (uiPhase === "lobby" && session) {
    const isStarter = session.participants[0]?.name === myName;
    return wrap(<>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>WAITING FOR PARTICIPANTS</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 20px" }}>
        {session.participants.length} {session.participants.length === 1 ? "person" : "people"} in the room
      </h2>
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "16px 20px", marginBottom: 20 }}>
        {session.participants.map(p => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR, flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: "#333" }}>{p.name}</span>
            {p.name === session.participants[0]?.name && <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>session host</span>}
          </div>
        ))}
      </div>
      {isStarter && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 8px" }}>Share this link:</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={shareUrl} style={{ ...inputSt(), fontSize: 12, flex: 1 }} />
            <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{
              padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: `1.5px solid ${COLOR}50`, background: `${COLOR}08`, color: COLOR, fontFamily: FONT, whiteSpace: "nowrap",
            }}>Copy →</button>
          </div>
        </div>
      )}
      {isStarter ? (
        <button onClick={handleStartSetup} disabled={session.participants.length < 2} style={{
          width: "100%", padding: "13px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
          cursor: session.participants.length >= 2 ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
          background: session.participants.length >= 2 ? COLOR : "#e8e8e8",
          color: session.participants.length >= 2 ? "#fff" : "#bbb",
        }}>
          {session.participants.length < 2 ? "Waiting for at least 1 more person…" : "Everyone's here — choose category →"}
        </button>
      ) : (
        <p style={{ fontSize: 14, color: "#aaa", textAlign: "center" }}>Waiting for the host to start…</p>
      )}
    </>);
  }

  // ── Setup (starter only) ──
  if (uiPhase === "setup") return wrap(<>
    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>CHOOSE CATEGORY</p>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 20px" }}>What do you want to explore?</h2>
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {PRESET_CATEGORIES.map(c => (
        <button key={c} onClick={() => setCategory(c)} style={{
          padding: "12px 16px", borderRadius: 10, fontSize: 14, cursor: "pointer",
          border: `1.5px solid ${category === c ? COLOR : "#e8e8e8"}`,
          background: category === c ? `${COLOR}10` : "#fff",
          color: category === c ? COLOR : "#555",
          textAlign: "left", fontFamily: FONT, fontWeight: category === c ? 600 : 400,
        }}>{c}</button>
      ))}
      <button onClick={() => setCategory("__custom__")} style={{
        padding: "12px 16px", borderRadius: 10, fontSize: 14, cursor: "pointer",
        border: `1.5px solid ${category === "__custom__" ? COLOR : "#e8e8e8"}`,
        background: category === "__custom__" ? `${COLOR}10` : "#fff",
        color: category === "__custom__" ? COLOR : "#888",
        textAlign: "left", fontFamily: FONT, fontStyle: "italic",
      }}>Custom topic…</button>
    </div>
    {category === "__custom__" && (
      <input value={customCat} onChange={e => setCustomCat(e.target.value)}
        placeholder="Describe the topic…" style={{ ...inputSt(), marginBottom: 16 }} autoFocus />
    )}
    <button
      onClick={handleGenerateQuestions}
      disabled={generating || !category || (category === "__custom__" && !customCat.trim())}
      style={{
        width: "100%", padding: "13px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
        cursor: "pointer", border: "none", fontFamily: FONT,
        background: generating ? "#e8e8e8" : COLOR, color: generating ? "#bbb" : "#fff",
      }}
    >
      {generating ? "Generating questions…" : "Generate 5 questions →"}
    </button>
  </>);

  // ── Assessing ──
  if (uiPhase === "assessing" && session) {
    if (submitting) return wrap(
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 15, color: "#888" }}>Submitting your ratings…</p>
      </div>
    );

    const allPeople = session.participants.map(p => p.name);
    const [qi, pi] = ratingPos;
    const question = session.questions?.[qi] ?? "";
    const rateeName = allPeople[pi];
    const isSelf = rateeName === myName;
    const total = (session.questions?.length ?? 5) * allPeople.length;
    const done = qi * allPeople.length + pi;

    if (!session.questions?.length) return wrap(
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 15, color: "#888" }}>Waiting for questions to be generated…</p>
      </div>
    );

    return wrap(<>
      {/* Progress */}
      <div style={{ height: 4, background: "#e8e8e8", borderRadius: 2, marginBottom: 28, overflow: "hidden" }}>
        <div style={{ height: "100%", background: COLOR, width: `${(done / total) * 100}%`, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>
        QUESTION {qi + 1} OF {session.questions.length} · {isSelf ? "ABOUT YOURSELF" : `ABOUT ${rateeName.toUpperCase()}`}
      </p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 24px", lineHeight: 1.3 }}>
        {question.replace(/\[name\]/gi, isSelf ? "you" : rateeName)}
      </h2>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => handleRate(true)} style={{
          flex: 1, padding: "20px", borderRadius: 14, fontSize: 24, cursor: "pointer",
          border: "2px solid #1d9e75", background: "#1d9e7510", fontFamily: FONT,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          transition: "all 0.15s",
        }}>
          <span>✓</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1d9e75" }}>Yes</span>
        </button>
        <button onClick={() => handleRate(false)} style={{
          flex: 1, padding: "20px", borderRadius: 14, fontSize: 24, cursor: "pointer",
          border: "2px solid #d4537e", background: "#d4537e10", fontFamily: FONT,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        }}>
          <span>✕</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#d4537e" }}>No</span>
        </button>
      </div>

      <p style={{ fontSize: 12, color: "#bbb", textAlign: "center", marginTop: 20 }}>
        {total - done - 1} ratings remaining
      </p>
    </>);
  }

  // ── Waiting for others ──
  if (uiPhase === "results" && session && session.phase !== "results") return wrap(
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ width: 48, height: 48, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize: 15, color: "#888", margin: "0 0 8px" }}>Your ratings are in! Waiting for others…</p>
      <p style={{ fontSize: 13, color: "#bbb" }}>
        {session.participants.filter(p => p.done).length} / {session.participants.length} done
      </p>
    </div>
  );

  // ── Results ──
  if ((uiPhase === "results") && session) {
    const results = computeResults();
    return wrap(<>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>YOUR JOHARI WINDOW</p>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: COLOR, margin: "0 0 6px" }}>
        {myName}'s Results
      </h2>
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px" }}>
        Category: <strong style={{ color: "#555" }}>{session.category}</strong> · {session.participants.length - 1} {session.participants.length === 2 ? "rater" : "raters"}
      </p>

      {results.map((r, i) => (
        <JohariDiagram key={i} {...r} />
      ))}

      <div style={{ borderTop: "1px solid #eee", paddingTop: 24, marginTop: 8 }}>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, margin: "0 0 16px" }}>
          <strong style={{ color: "#555" }}>Legend:</strong>{" "}
          <span style={{ color: QUADRANTS.open.color }}>● Open</span> — both you and others see it &nbsp;
          <span style={{ color: QUADRANTS.blind.color }}>● Blind Spot</span> — others see it, you don't &nbsp;
          <span style={{ color: QUADRANTS.hidden.color }}>● Hidden</span> — you see it, others don't &nbsp;
          <span style={{ color: "#999" }}>● Unknown</span> — neither sees it
        </p>
      </div>
    </>);
  }

  return null;
}

export default function JohariPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f7f7f5" }} />}>
      <JohariInner />
    </Suspense>
  );
}
