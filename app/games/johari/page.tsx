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

const QUADRANT_CONFIG = {
  open:    { label: "Open / Arena",    color: "#1d9e75", bg: "#1d9e7512", desc: "Known to self & others" },
  blind:   { label: "Blind Spot",      color: "#d4537e", bg: "#d4537e12", desc: "Others see it — you don't" },
  hidden:  { label: "Hidden / Facade", color: "#378add", bg: "#378add12", desc: "You see it — others don't" },
  unknown: { label: "Unknown",         color: "#bbb",    bg: "#f8f8f8",   desc: "Not selected by anyone" },
};

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
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>
          {content}
        </div>
      </div>
    </div>
  );
}

// ── Attribute chip ────────────────────────────────────────────────────────────

function Chip({ label, selected, color, onClick }: { label: string; selected: boolean; color?: string; onClick?: () => void }) {
  const c = color ?? COLOR;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: selected ? 600 : 400,
        cursor: onClick ? "pointer" : "default",
        border: `1.5px solid ${selected ? c : "#e0e0e0"}`,
        background: selected ? `${c}15` : "#fff",
        color: selected ? c : "#888",
        fontFamily: FONT, transition: "all 0.12s",
      }}
    >{label}</button>
  );
}

// ── Quadrant display ──────────────────────────────────────────────────────────

function QuadrantBox({ type, attrs }: { type: keyof typeof QUADRANT_CONFIG; attrs: string[] }) {
  const q = QUADRANT_CONFIG[type];
  return (
    <div style={{ background: q.bg, border: `2px solid ${q.color}50`, borderRadius: 12, padding: 14, minHeight: 90 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: q.color, letterSpacing: "0.07em", margin: "0 0 8px" }}>{q.label.toUpperCase()}</p>
      <p style={{ fontSize: 10, color: q.color, opacity: 0.7, margin: "0 0 8px" }}>{q.desc}</p>
      {attrs.length === 0
        ? <span style={{ fontSize: 12, color: "#ccc" }}>—</span>
        : <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {attrs.map(a => <Chip key={a} label={a} selected color={q.color} />)}
          </div>}
    </div>
  );
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function postSession(action: string, data: Record<string, unknown>): Promise<JohariSession | null> {
  const res = await fetch("/api/games/johari/session", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function pollSession(id: string): Promise<JohariSession | null> {
  const res = await fetch(`/api/games/johari/session?id=${id}`);
  if (!res.ok) return null;
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

type UIPhase = "landing" | "join" | "lobby" | "setup" | "assessing" | "waiting" | "results";

function JohariInner() {
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("s");

  const [uiPhase, setUiPhase]   = useState<UIPhase>(urlSessionId ? "join" : "landing");
  const [sessionId, setSessionId] = useState(urlSessionId ?? "");
  const [myName, setMyName]     = useState("");
  const [nameInput, setNameInput] = useState("");
  const [session, setSession]   = useState<JohariSession | null>(null);
  const [joinError, setJoinError] = useState("");

  // Setup
  const [category, setCategory]     = useState("");
  const [customCat, setCustomCat]   = useState("");
  const [generating, setGenerating] = useState(false);

  // Assessing: for each participant, collect their selections
  // currentPersonIdx: which person we're currently rating
  const [currentPersonIdx, setCurrentPersonIdx] = useState(0);
  // pendingSelections[rateeName] = string[] of selected attrs
  const [pendingSelections, setPendingSelections] = useState<Record<string, string[]>>({});
  const [chipSelected, setChipSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Poll
  const doPolling = useCallback(async () => {
    if (!sessionId) return;
    const s = await pollSession(sessionId);
    if (!s) return;
    setSession(s);
    if (s.phase === "assessing" && (uiPhase === "lobby" || uiPhase === "setup")) setUiPhase("assessing");
    if (s.phase === "results" && uiPhase === "waiting") setUiPhase("results");
  }, [sessionId, uiPhase]);

  useEffect(() => {
    if (!sessionId || uiPhase === "landing" || uiPhase === "join" || uiPhase === "results") return;
    const t = setInterval(doPolling, 3000);
    return () => clearInterval(t);
  }, [sessionId, uiPhase, doPolling]);

  // ── Create ──
  async function handleCreate() {
    const name = nameInput.trim();
    if (!name) return;
    const s = await postSession("create", { name });
    if (!s) return;
    setMyName(name); setSessionId(s.id); setSession(s); setUiPhase("lobby");
  }

  // ── Join ──
  async function handleJoin() {
    const name = nameInput.trim();
    if (!name || !sessionId) return;
    setJoinError("");
    const s = await postSession("join", { id: sessionId, name });
    if (!s) { setJoinError("Session not found — ask the host for a fresh link."); return; }
    setMyName(name); setSession(s);
    setUiPhase(s.phase === "assessing" ? "assessing" : "lobby");
  }

  // ── Start setup ──
  async function handleStartSetup() {
    const s = await postSession("start-setup", { id: sessionId });
    if (s) { setSession(s); setUiPhase("setup"); }
  }

  // ── Generate attributes ──
  async function handleGenerateAttributes() {
    const cat = category === "__custom__" ? customCat.trim() : category;
    if (!cat) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/games/johari/questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat }),
      });
      const { attributes } = await res.json();
      const s = await postSession("set-attributes", { id: sessionId, category: cat, attributes });
      if (s) {
        setSession(s);
        setCurrentPersonIdx(0);
        setChipSelected([]);
        setPendingSelections({});
        setUiPhase("assessing");
      }
    } finally { setGenerating(false); }
  }

  // ── Toggle chip ──
  function toggleChip(attr: string) {
    setChipSelected(prev =>
      prev.includes(attr) ? prev.filter(a => a !== attr) : [...prev, attr]
    );
  }

  // ── Confirm selection for current person, advance ──
  function confirmSelection() {
    if (!session) return;
    const allPeople = session.participants.map(p => p.name);
    const rateeName = allPeople[currentPersonIdx];
    const newSelections = { ...pendingSelections, [rateeName]: chipSelected };
    setPendingSelections(newSelections);

    if (currentPersonIdx < allPeople.length - 1) {
      setCurrentPersonIdx(i => i + 1);
      setChipSelected([]);
    } else {
      submitSelections(newSelections);
    }
  }

  async function submitSelections(sels: Record<string, string[]>) {
    setSubmitting(true);
    const s = await postSession("submit-selections", { id: sessionId, rater: myName, selections: sels });
    if (s) {
      setSession(s);
      setUiPhase(s.phase === "results" ? "results" : "waiting");
    }
    setSubmitting(false);
  }

  // ── Compute Johari for a given person ──
  function computeJohari(targetName: string): { open: string[]; blind: string[]; hidden: string[]; unknown: string[] } {
    if (!session) return { open: [], blind: [], hidden: [], unknown: [] };
    const attrs = session.attributes;
    const selfSelected = new Set(session.selections[targetName]?.[targetName] ?? []);
    const others = session.participants.filter(p => p.name !== targetName);

    const othersSelectedCount = (attr: string) =>
      others.filter(o => (session.selections[o.name]?.[targetName] ?? []).includes(attr)).length;

    const open: string[]    = [];
    const blind: string[]   = [];
    const hidden: string[]  = [];
    const unknown: string[] = [];

    attrs.forEach(attr => {
      const iSee    = selfSelected.has(attr);
      const othersSee = othersSelectedCount(attr) > 0;
      if (iSee && othersSee)       open.push(attr);
      else if (!iSee && othersSee) blind.push(attr);
      else if (iSee && !othersSee) hidden.push(attr);
      else                         unknown.push(attr);
    });

    return { open, blind, hidden, unknown };
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/games/johari?s=${sessionId}` : "";

  // ──────────── RENDER ────────────

  // Landing
  if (uiPhase === "landing") return wrap(<>
    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>Johari Window</h1>
    <p style={{ fontSize: 15, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
      Discover what you know about yourself — and what others see that you don't. A shared team assessment using 20 attributes.
    </p>
    <div style={{ background: `${COLOR}10`, border: `1.5px solid ${COLOR}30`, borderRadius: 14, padding: "18px 20px", marginBottom: 28 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: COLOR, letterSpacing: "0.06em", margin: "0 0 10px" }}>HOW IT WORKS</p>
      {["Create a session and invite your team via link",
        "Host picks a category — AI generates 20 traits",
        "Each person selects traits for themselves, then for each teammate",
        "Everyone gets a personal Johari Window — 4 quadrants, 20 traits placed"].map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLOR, minWidth: 18 }}>{i + 1}</span>
          <span style={{ fontSize: 13, color: "#666" }}>{s}</span>
        </div>
      ))}
    </div>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>YOUR NAME</label>
    <input value={nameInput} onChange={e => setNameInput(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter" && nameInput.trim()) handleCreate(); }}
      placeholder="Enter your name…" autoFocus style={{ ...inputSt(), marginBottom: 14 }} />
    <button onClick={handleCreate} disabled={!nameInput.trim()} style={{
      width: "100%", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: nameInput.trim() ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
      background: nameInput.trim() ? COLOR : "#e8e8e8", color: nameInput.trim() ? "#fff" : "#bbb",
    }}>Create session →</button>
  </>);

  // Join
  if (uiPhase === "join") return wrap(<>
    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>Join Johari Session</h1>
    <p style={{ fontSize: 14, color: "#888", margin: "0 0 24px" }}>You've been invited. Enter your name to join.</p>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>YOUR NAME</label>
    <input value={nameInput} onChange={e => setNameInput(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter" && nameInput.trim()) handleJoin(); }}
      placeholder="Enter your name…" autoFocus style={{ ...inputSt(), marginBottom: 12 }} />
    {joinError && <p style={{ fontSize: 13, color: "#d4537e", margin: "0 0 12px", padding: "10px 14px", background: "#d4537e10", borderRadius: 8 }}>{joinError}</p>}
    <button onClick={handleJoin} disabled={!nameInput.trim()} style={{
      width: "100%", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: nameInput.trim() ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
      background: nameInput.trim() ? COLOR : "#e8e8e8", color: nameInput.trim() ? "#fff" : "#bbb",
    }}>Join →</button>
  </>);

  // Lobby
  if (uiPhase === "lobby" && session) {
    const isHost = session.participants[0]?.name === myName;
    return wrap(<>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>WAITING ROOM</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 20px" }}>
        {session.participants.length} {session.participants.length === 1 ? "person" : "people"} in the session
      </h2>
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "16px 20px", marginBottom: 20 }}>
        {session.participants.map(p => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR, flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: "#333" }}>{p.name}</span>
            {p.name === session.participants[0]?.name && <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto" }}>host</span>}
          </div>
        ))}
      </div>
      {isHost && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 8px" }}>Share this link with your team:</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={shareUrl} style={{ ...inputSt(), fontSize: 12, flex: 1 }} />
            <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{
              padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: `1.5px solid ${COLOR}50`, background: `${COLOR}08`, color: COLOR, fontFamily: FONT, whiteSpace: "nowrap",
            }}>Copy →</button>
          </div>
        </div>
      )}
      {isHost ? (
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

  // Setup
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
        placeholder="Describe the topic…" autoFocus style={{ ...inputSt(), marginBottom: 16 }} />
    )}
    <button onClick={handleGenerateAttributes} disabled={generating || !category || (category === "__custom__" && !customCat.trim())} style={{
      width: "100%", padding: "13px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
      cursor: "pointer", border: "none", fontFamily: FONT,
      background: generating ? "#e8e8e8" : COLOR, color: generating ? "#bbb" : "#fff",
    }}>{generating ? "Generating attributes…" : "Generate 20 attributes →"}</button>
  </>);

  // Assessing
  if (uiPhase === "assessing" && session) {
    if (submitting) return wrap(
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 15, color: "#888" }}>Submitting…</p>
      </div>
    );

    if (!session.attributes?.length) return wrap(
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 15, color: "#888" }}>Waiting for attributes to be generated…</p>
      </div>
    );

    const allPeople = session.participants.map(p => p.name);
    const rateeName = allPeople[currentPersonIdx];
    const isSelf    = rateeName === myName;

    return wrap(<>
      {/* Progress */}
      <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
        {allPeople.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < currentPersonIdx ? COLOR : i === currentPersonIdx ? `${COLOR}60` : "#e8e8e8" }} />
        ))}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>
        {currentPersonIdx + 1} OF {allPeople.length}
      </p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 6px" }}>
        {isSelf ? "Select traits that apply to you" : `Select traits that apply to ${rateeName}`}
      </h2>
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 20px" }}>
        Choose as many as feel true — or none if none fit.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {session.attributes.map(attr => (
          <Chip key={attr} label={attr} selected={chipSelected.includes(attr)} onClick={() => toggleChip(attr)} />
        ))}
      </div>

      <button onClick={confirmSelection} style={{
        width: "100%", padding: "13px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
        cursor: "pointer", border: "none", fontFamily: FONT, background: COLOR, color: "#fff",
      }}>
        {currentPersonIdx < allPeople.length - 1
          ? `Confirm & rate ${allPeople[currentPersonIdx + 1] === myName ? "yourself" : allPeople[currentPersonIdx + 1]} →`
          : "Submit all ratings →"}
      </button>
    </>);
  }

  // Waiting
  if (uiPhase === "waiting" && session) return wrap(
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ width: 48, height: 48, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize: 15, color: "#888", margin: "0 0 8px" }}>Your ratings are in! Waiting for others…</p>
      <p style={{ fontSize: 13, color: "#bbb" }}>
        {session.participants.filter(p => p.done).length} / {session.participants.length} done
      </p>
    </div>
  );

  // Results
  if (uiPhase === "results" && session) {
    const { open, blind, hidden, unknown } = computeJohari(myName);
    return wrap(<>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 4px" }}>YOUR JOHARI WINDOW</p>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: COLOR, margin: "0 0 4px" }}>{myName}</h2>
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px" }}>
        Category: <strong style={{ color: "#555" }}>{session.category}</strong> · {session.participants.length - 1} {session.participants.length === 2 ? "rater" : "raters"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <QuadrantBox type="open"    attrs={open} />
        <QuadrantBox type="blind"   attrs={blind} />
        <QuadrantBox type="hidden"  attrs={hidden} />
        <QuadrantBox type="unknown" attrs={unknown} />
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #eee", padding: "14px 18px" }}>
        <p style={{ fontSize: 12, color: "#888", margin: 0, lineHeight: 1.7 }}>
          <strong style={{ color: QUADRANT_CONFIG.open.color }}>Open</strong>: you & others selected it ·{" "}
          <strong style={{ color: QUADRANT_CONFIG.blind.color }}>Blind Spot</strong>: others selected it, you didn't ·{" "}
          <strong style={{ color: QUADRANT_CONFIG.hidden.color }}>Hidden</strong>: you selected it, others didn't ·{" "}
          <strong style={{ color: "#bbb" }}>Unknown</strong>: no one selected it
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
