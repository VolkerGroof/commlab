"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Voice {
  id: string;
  name: string;
  description: string;
  positiveIntent: string;
  originalText: string;
  volume: number; // 1–6
  loudnessReflection: string;
  infoSufficient: string; // "yes" | "partial" | "no" | ""
  missingInfo: string;
  userMessage: string;
  revisedPosition: string;
}

type Step =
  | "trouble" | "collect" | "analyzing" | "review"
  | "missing" | "voice-deep" | "overview"
  | "dialogue" | "generating-revised" | "after-voices"
  | "decision" | "done";

type VoiceDeepSub = "volume" | "behind" | "info" | "missing-info";

interface MissingSuggestion {
  name: string;
  question: string;
  positiveIntent: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VOICE_COLORS = ["#7c6fcd","#1d9e75","#e07a3a","#d4537e","#378add","#639922","#c0392b","#8e44ad"];
const VOLUME_LABELS = ["","Barely there","Quiet","Present","Noticeable","Loud","Dominant"];
const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

// ── Volume Knob ───────────────────────────────────────────────────────────────

function VolumeKnob({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  const knobRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const dragStartY = useRef<number | null>(null);
  const dragStartVal = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Wheel — non-passive
  useEffect(() => {
    const el = knobRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      onChangeRef.current(Math.min(6, Math.max(1, valueRef.current + delta)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Drag
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragStartY.current === null) return;
      const delta = Math.round((dragStartY.current - e.clientY) / 14);
      onChangeRef.current(Math.min(6, Math.max(1, dragStartVal.current + delta)));
    };
    const up = () => { dragStartY.current = null; };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
    dragStartVal.current = valueRef.current;
  };

  // SVG geometry
  const cx = 80, cy = 80, r = 52;
  const MIN_ANG = -135, MAX_ANG = 135;
  const curAng = MIN_ANG + (value - 1) * (270 / 5);

  const polar = (ang: number, radius: number) => ({
    x: cx + radius * Math.sin(ang * Math.PI / 180),
    y: cy - radius * Math.cos(ang * Math.PI / 180),
  });

  const arc = (a1: number, a2: number, radius: number) => {
    const s = polar(a1, radius), e = polar(a2, radius);
    return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${radius} ${radius} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
  };

  const ptr = polar(curAng, r - 14);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div ref={knobRef} onMouseDown={onMouseDown} style={{ cursor: "ns-resize", userSelect: "none" }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Track background */}
          <path d={arc(MIN_ANG, MAX_ANG, r)} fill="none" stroke="#ececec" strokeWidth="7" strokeLinecap="round" />
          {/* Active track */}
          {value > 1 && <path d={arc(MIN_ANG, curAng, r)} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" opacity="0.75" />}
          {/* Tick marks */}
          {[1,2,3,4,5,6].map(n => {
            const ang = MIN_ANG + (n - 1) * 54;
            const o = polar(ang, r + 8), i = polar(ang, r - 1);
            return <line key={n} x1={i.x} y1={i.y} x2={o.x} y2={o.y}
              stroke={n <= value ? color : "#ddd"} strokeWidth={n === value ? 3 : 1.5} strokeLinecap="round" />;
          })}
          {/* Knob */}
          <circle cx={cx} cy={cy} r={r - 17} fill="#fff" stroke={color} strokeWidth="2.5" />
          {/* Pointer */}
          <line x1={cx} y1={cy} x2={ptr.x} y2={ptr.y} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={4} fill={color} />
        </svg>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => onChange(Math.max(1, value - 1))}
          style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${color}`, background: "#fff", color, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>−</button>
        <span style={{ fontSize: 14, fontWeight: 700, color, minWidth: 130, textAlign: "center" }}>
          {value} — {VOLUME_LABELS[value]}
        </span>
        <button onClick={() => onChange(Math.min(6, value + 1))}
          style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${color}`, background: "#fff", color, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>+</button>
      </div>
      <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>Scroll, drag or use ± buttons</p>
    </div>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 8px" }}>{text}</p>;
}

function inputSt(o?: React.CSSProperties): React.CSSProperties {
  return { width: "100%", fontSize: 15, padding: "13px 16px", border: "1.5px solid #e0e0e0", borderRadius: 12, outline: "none", boxSizing: "border-box", color: "#111", fontFamily: font, background: "#fff", ...o };
}

function btnSt(color: string, outline = false, disabled = false): React.CSSProperties {
  return { padding: "12px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", border: outline ? `1.5px solid ${disabled ? "#ddd" : color}` : "none", background: outline ? "transparent" : (disabled ? "#e8e8e8" : color), color: disabled ? "#bbb" : (outline ? color : "#fff"), fontFamily: font };
}

function ChallengeBar({ text }: { text: string }) {
  return (
    <div style={{ background: "#f0f0ee", borderRadius: 12, padding: "12px 16px", marginBottom: 28, fontSize: 14, color: "#555" }}>
      <strong style={{ color: "#111" }}>Challenge: </strong>{text}
    </div>
  );
}

function OriginalText({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#666", lineHeight: 1.55, fontStyle: "italic" }}>
      &ldquo;{text}&rdquo;
    </div>
  );
}

// ── Overview suggestions (rule-based) ────────────────────────────────────────

interface Observation { text: string; detail?: string; }

function infoSuggestion(missing: string): string {
  const m = missing.toLowerCase();
  const suggestions: string[] = [];
  if (m.includes("salary") || m.includes("pay") || m.includes("money") || m.includes("financ")) suggestions.push("request a detailed offer letter or speak directly with HR");
  if (m.includes("team") || m.includes("colleague") || m.includes("people") || m.includes("kultur") || m.includes("culture")) suggestions.push("ask for a trial day or informal coffee with the team");
  if (m.includes("role") || m.includes("task") || m.includes("expect") || m.includes("responsib")) suggestions.push("ask for a written role description and 90-day expectations");
  if (m.includes("boss") || m.includes("manager") || m.includes("leader") || m.includes("führung")) suggestions.push("ask your future manager directly how they like to work");
  if (m.includes("risk") || m.includes("sicher") || m.includes("safe") || m.includes("stabili")) suggestions.push("talk to someone who has made a similar move");
  if (m.includes("develop") || m.includes("grow") || m.includes("learn") || m.includes("future")) suggestions.push("ask about learning budget, promotion paths and career development");
  if (suggestions.length === 0) suggestions.push("have a direct conversation with the people involved", "talk to someone who has relevant experience");
  return `You could try: ${suggestions.slice(0, 2).join("; ")}.`;
}

function buildSuggestions(voices: Voice[]): Observation[] {
  const obs: Observation[] = [];
  const loud = voices.filter(v => v.volume >= 5);
  const quiet = voices.filter(v => v.volume <= 2);
  if (loud.length) obs.push({ text: `${loud.map(v => v.name).join(" and ")} ${loud.length === 1 ? "is" : "are"} very dominant. Make sure the quieter voices also get a fair hearing.` });
  if (quiet.length) obs.push({ text: `${quiet.map(v => v.name).join(" and ")} ${quiet.length === 1 ? "is" : "are"} barely audible. Quiet voices often carry important wisdom.` });
  voices.filter(v => v.infoSufficient === "no").forEach(v => {
    const missing = v.missingInfo.trim();
    obs.push({ text: `${v.name} is operating on mostly assumptions.`, detail: (missing ? `Missing: "${missing}". ` : "") + infoSuggestion(missing) });
  });
  voices.filter(v => v.infoSufficient === "partial").forEach(v => {
    const missing = v.missingInfo.trim();
    obs.push({ text: `${v.name} has some information gaps.`, detail: (missing ? `Missing: "${missing}". ` : "") + infoSuggestion(missing) });
  });
  return obs;
}

// ── JSON Save / Load ──────────────────────────────────────────────────────────

interface SavedSession {
  version: number;
  troubleStatement: string;
  voices: Voice[];
  step: Step;
  voiceDeepIndex: number;
  voiceDeepSub: VoiceDeepSub;
  dialogueIndex: number;
  decision: string;
}

function saveSession(data: SavedSession) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "inner-team-session.json";
  a.click();
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InnerTeamPage() {
  const [step, setStep] = useState<Step>("trouble");
  const [troubleStatement, setTroubleStatement] = useState("");
  const [thoughtsText, setThoughtsText] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [suggestions, setSuggestions] = useState<MissingSuggestion[]>([]);
  const [suggestionChoices, setSuggestionChoices] = useState<("yes"|"no"|null)[]>([]);
  const [suggestionInputs, setSuggestionInputs] = useState<string[]>([]);
  const [voiceDeepIndex, setVoiceDeepIndex] = useState(0);
  const [voiceDeepSub, setVoiceDeepSub] = useState<VoiceDeepSub>("volume");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [decision, setDecision] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [showAllVoices, setShowAllVoices] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function generateId() { return Math.random().toString(36).slice(2, 9); }

  // ── Session Save / Load ───────────────────────────────────────────────────

  function handleSave() {
    saveSession({ version: 1, troubleStatement, voices, step, voiceDeepIndex, voiceDeepSub, dialogueIndex, decision });
  }

  function handleLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data: SavedSession = JSON.parse(ev.target?.result as string);
        setTroubleStatement(data.troubleStatement);
        setVoices(data.voices);
        setStep(data.step);
        setVoiceDeepIndex(data.voiceDeepIndex);
        setVoiceDeepSub(data.voiceDeepSub);
        setDialogueIndex(data.dialogueIndex);
        setDecision(data.decision);
      } catch { alert("Could not read session file."); }
    };
    reader.readAsText(file);
  }

  // ── API Handlers ──────────────────────────────────────────────────────────

  async function handleAnalyze() {
    setStep("analyzing");
    const paragraphs = thoughtsText.split(/\n+/).map(p => p.trim()).filter(Boolean);
    const res = await fetch("/api/games/inner-team/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ troubleStatement, paragraphs }),
    });
    const data = await res.json();
    setVoices((data.voices || []).slice(0, 8).map((v: { name: string; description: string; positiveIntent: string; paragraphIndex: number }) => ({
      id: generateId(), name: v.name, description: v.description, positiveIntent: v.positiveIntent,
      originalText: paragraphs[v.paragraphIndex] || "",
      volume: 3, loudnessReflection: "", infoSufficient: "", missingInfo: "", userMessage: "", revisedPosition: "",
    })));
    setStep("review");
  }

  async function handleFetchMissing() {
    const res = await fetch("/api/games/inner-team/missing", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ troubleStatement, existingVoices: voices.map(v => ({ name: v.name, description: v.description })) }),
    });
    const data = await res.json();
    const sugg: MissingSuggestion[] = data.suggestions || [];
    setSuggestions(sugg);
    setSuggestionChoices(sugg.map(() => null));
    setSuggestionInputs(sugg.map(() => ""));
    setStep("missing");
  }

  function handleAddSuggestions() {
    const newVoices: Voice[] = [];
    suggestions.forEach((s, i) => {
      if (suggestionChoices[i] === "yes" && suggestionInputs[i].trim() && voices.length + newVoices.length < 8) {
        newVoices.push({
          id: generateId(), name: s.name, description: suggestionInputs[i].trim(),
          positiveIntent: s.positiveIntent, originalText: suggestionInputs[i].trim(),
          volume: 3, loudnessReflection: "", infoSufficient: "", missingInfo: "", userMessage: "", revisedPosition: "",
        });
      }
    });
    setVoices(v => [...v, ...newVoices]);
    setVoiceDeepIndex(0);
    setVoiceDeepSub("volume");
    setStep("voice-deep");
  }

  async function handleGenerateRevised() {
    setStep("generating-revised");
    const res = await fetch("/api/games/inner-team/revised", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        troubleStatement,
        voices: voices.map(v => ({ name: v.name, description: v.description, positiveIntent: v.positiveIntent, userMessage: v.userMessage || "(no message)" })),
      }),
    });
    const data = await res.json();
    const positions: { name: string; revisedPosition: string }[] = data.revisedPositions || [];
    setVoices(prev => prev.map(v => {
      const m = positions.find(p => p.name === v.name);
      return m ? { ...v, revisedPosition: m.revisedPosition } : v;
    }));
    setStep("after-voices");
  }

  async function downloadImage() {
    if (!resultRef.current) return;
    setDownloading(true);
    try {
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(resultRef.current, { backgroundColor: "#f7f7f5", scale: 2, useCORS: true });
      const a = document.createElement("a"); a.download = "inner-team.png"; a.href = canvas.toDataURL("image/png"); a.click();
    } finally { setDownloading(false); }
  }

  // ── Voice-deep navigation ─────────────────────────────────────────────────

  const currentVoice = voices[voiceDeepIndex];
  const currentColor = VOICE_COLORS[voiceDeepIndex % VOICE_COLORS.length];

  function nextVoiceDeepSub() {
    const v = voices[voiceDeepIndex];
    if (voiceDeepSub === "volume") { setVoiceDeepSub("behind"); return; }
    if (voiceDeepSub === "behind") { setVoiceDeepSub("info"); return; }
    if (voiceDeepSub === "info") {
      if (v.infoSufficient === "partial" || v.infoSufficient === "no") { setVoiceDeepSub("missing-info"); return; }
      advanceVoice(); return;
    }
    if (voiceDeepSub === "missing-info") { advanceVoice(); }
  }

  function advanceVoice() {
    if (voiceDeepIndex < voices.length - 1) {
      setVoiceDeepIndex(i => i + 1);
      setVoiceDeepSub("volume");
    } else {
      setStep("overview");
    }
  }

  const updateVoice = useCallback((id: string, patch: Partial<Voice>) => {
    setVoices(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v));
  }, []);

  // Stable onChange for knob
  const handleVolumeChange = useCallback((vol: number) => {
    setVoices(prev => {
      const v = prev[voiceDeepIndex];
      if (!v) return prev;
      return prev.map((x, i) => i === voiceDeepIndex ? { ...x, volume: vol } : x);
    });
  }, [voiceDeepIndex]);

  const handleDialogueVolumeChange = useCallback((vol: number) => {
    setVoices(prev => {
      const v = prev[dialogueIndex];
      if (!v) return prev;
      return prev.map((x, i) => i === dialogueIndex ? { ...x, volume: vol } : x);
    });
  }, [dialogueIndex]);

  // ── Layout ────────────────────────────────────────────────────────────────

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: font }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #eee", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← CommLab</Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>The Inner Team</span>
        <span />
      </div>
      <div style={{ paddingTop: 52 }}>{children}</div>
    </div>
  );

  const narrow = (children: React.ReactNode) => (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "56px 24px 80px" }}>{children}</div>
  );

  const wide = (children: React.ReactNode) => (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>{children}</div>
  );

  const PauseBar = () => (
    <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "20px 0", padding: "14px 18px", background: "#fff", borderRadius: 12, border: "1px solid #eee" }}>
      <span style={{ fontSize: 13, color: "#888", flex: 1 }}>Need a break? Save your session and continue later.</span>
      <button onClick={handleSave} style={btnSt("#111", true)}>⬇ Save session</button>
      <button onClick={() => fileInputRef.current?.click()} style={btnSt("#111", true)}>↑ Load session</button>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoad} style={{ display: "none" }} />
    </div>
  );

  const ActionOptions = ({ showReply = true }: { showReply?: boolean }) => (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
      {showReply && (
        <button onClick={() => { setDialogueIndex(0); setStep("dialogue"); }} style={btnSt("#7c6fcd")}>
          Reply to each voice →
        </button>
      )}
      <button onClick={() => setStep("decision")} style={btnSt("#1d9e75")}>
        Form a decision →
      </button>
    </div>
  );

  const TeamList = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[...voices].sort((a, b) => b.volume - a.volume).map((v) => {
        const idx = voices.indexOf(v);
        const color = VOICE_COLORS[idx % VOICE_COLORS.length];
        const bars = v.volume;
        return (
          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", background: "#fff", borderRadius: 12, border: `1.5px solid ${color}22` }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color }}>{v.name}</span>
            </div>
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
              {[1,2,3,4,5,6].map(n => (
                <div key={n} style={{ width: 5, height: 4 + n * 3, borderRadius: 2, background: n <= bars ? color : "#eee", transition: "background 0.2s" }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#aaa", minWidth: 76, textAlign: "right" }}>{VOLUME_LABELS[v.volume]}</span>
          </div>
        );
      })}
    </div>
  );

  // ── STEP: Trouble ─────────────────────────────────────────────────────────

  if (step === "trouble") return wrap(narrow(
    <>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>The Inner Team</h1>
      <p style={{ fontSize: 15, color: "#888", margin: "0 0 32px", lineHeight: 1.6 }}>
        Bring all your inner voices to the table — and let them find a common direction.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        <button onClick={() => fileInputRef.current?.click()} style={btnSt("#999", true)}>↑ Resume saved session</button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoad} style={{ display: "none" }} />
      </div>
      <Label text="YOUR CHALLENGE" />
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 10px", lineHeight: 1.5 }}>Write the question or situation challenging you right now. Be specific.</p>
      <textarea autoFocus value={troubleStatement} onChange={e => setTroubleStatement(e.target.value)}
        placeholder='"Should I take the new job offer, even though it means leaving my team?"'
        rows={3} style={{ ...inputSt(), resize: "none", lineHeight: 1.6 }} />
      <button onClick={() => setStep("collect")} disabled={!troubleStatement.trim()}
        style={{ ...btnSt(!troubleStatement.trim() ? "#e8e8e8" : "#111", false, !troubleStatement.trim()), marginTop: 14, width: "100%" }}>
        Continue →
      </button>
    </>
  ));

  // ── STEP: Collect ─────────────────────────────────────────────────────────

  if (step === "collect") return wrap(narrow(
    <>
      <ChallengeBar text={troubleStatement} />
      <Label text="YOUR INNER VOICES" />
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 12px", lineHeight: 1.6 }}>
        Write whatever comes to mind — concerns, impulses, fears, hopes. Press <strong>Enter</strong> to separate each voice. Don&apos;t filter yourself.
      </p>
      <textarea autoFocus value={thoughtsText} onChange={e => setThoughtsText(e.target.value)}
        placeholder={"This is too risky, I shouldn't do it.\n\nBut I'm bored where I am, I need a change.\n\nWhat if I fail in the new role?\n\nI owe it to myself to try."}
        rows={10} style={{ ...inputSt(), resize: "none", lineHeight: 1.7 }} />
      <button onClick={handleAnalyze} disabled={!thoughtsText.trim()}
        style={{ ...btnSt(!thoughtsText.trim() ? "#e8e8e8" : "#111", false, !thoughtsText.trim()), marginTop: 14, width: "100%" }}>
        Analyse my inner team →
      </button>
    </>
  ));

  // ── STEP: Analyzing ───────────────────────────────────────────────────────

  if (step === "analyzing") return wrap(narrow(
    <div style={{ textAlign: "center", paddingTop: 40 }}>
      <p style={{ fontSize: 16, color: "#888" }}>Identifying your inner team members…</p>
    </div>
  ));

  // ── STEP: Review ──────────────────────────────────────────────────────────

  if (step === "review") return wrap(wide(
    <>
      <ChallengeBar text={troubleStatement} />
      <Label text="YOUR INNER TEAM — EDIT NAMES IF NEEDED" />
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px", lineHeight: 1.5 }}>These voices were identified in what you wrote. Their names should feel like yours.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
        {voices.map((v, i) => {
          const color = VOICE_COLORS[i % VOICE_COLORS.length];
          return (
            <div key={v.id} style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${color}33`, overflow: "hidden" }}>
              <div style={{ height: 4, background: color }} />
              <div style={{ padding: "16px 18px 20px" }}>
                <input value={v.name} onChange={e => updateVoice(v.id, { name: e.target.value })}
                  style={{ ...inputSt({ padding: "8px 10px", fontSize: 14, fontWeight: 700, color, border: `1.5px solid ${color}44`, marginBottom: 10 }) }} />
                <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: "0 0 12px" }}>{v.description}</p>
                <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "10px 12px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.08em", margin: "0 0 4px" }}>POSITIVE INTENT</p>
                  <p style={{ fontSize: 12, color: "#666", margin: 0, lineHeight: 1.5 }}>{v.positiveIntent}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
        <button onClick={handleFetchMissing} style={btnSt("#111")}>Who else might be there? →</button>
        <button onClick={() => { setVoiceDeepIndex(0); setVoiceDeepSub("volume"); setStep("voice-deep"); }} style={btnSt("#999", true)}>
          Skip — go to volume
        </button>
      </div>
    </>
  ));

  // ── STEP: Missing ─────────────────────────────────────────────────────────

  if (step === "missing") return wrap(wide(
    <>
      <ChallengeBar text={troubleStatement} />
      <Label text="VOICES THAT MIGHT ALSO BE THERE" />
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px", lineHeight: 1.5 }}>
        Check inside — do any of these resonate? Click <strong>Add</strong> and write a short statement, or <strong>Not for me</strong> to skip.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {suggestions.map((s, i) => {
          const chosen = suggestionChoices[i];
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${chosen === "yes" ? "#7c6fcd" : chosen === "no" ? "#eee" : "#eee"}`, padding: "18px 20px", opacity: chosen === "no" ? 0.45 : 1, transition: "all 0.2s" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 6px" }}>{s.name}</p>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 14px", lineHeight: 1.5, fontStyle: "italic" }}>&ldquo;{s.question}&rdquo;</p>
              <div style={{ display: "flex", gap: 8, marginBottom: chosen === "yes" ? 12 : 0 }}>
                <button onClick={() => setSuggestionChoices(prev => prev.map((x, j) => j === i ? "yes" : x))}
                  style={{ ...btnSt("#7c6fcd", chosen !== "yes"), fontSize: 13, padding: "8px 16px" }}>
                  + Add to my team
                </button>
                <button onClick={() => setSuggestionChoices(prev => prev.map((x, j) => j === i ? "no" : x))}
                  style={{ ...btnSt("#999", chosen !== "no"), fontSize: 13, padding: "8px 16px" }}>
                  Not for me
                </button>
              </div>
              {chosen === "yes" && (
                <textarea value={suggestionInputs[i] || ""} onChange={e => setSuggestionInputs(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                  placeholder="Write a short statement for this voice…"
                  rows={2} style={{ ...inputSt({ fontSize: 13 }), resize: "none", lineHeight: 1.6 }} />
              )}
            </div>
          );
        })}
      </div>
      <button onClick={handleAddSuggestions} style={{ ...btnSt("#111"), marginTop: 24, width: "100%" }}>
        Continue to volume ranking →
      </button>
    </>
  ));

  // ── STEP: Voice Deep ──────────────────────────────────────────────────────

  if (step === "voice-deep" && currentVoice) {
    const progress = `${voiceDeepIndex + 1} / ${voices.length}`;
    const subLabels: Record<VoiceDeepSub, string> = {
      volume: "HOW LOUD IS THIS VOICE?",
      behind: "WHAT'S BEHIND THIS LOUDNESS?",
      info: "DO YOU HAVE ENOUGH INFORMATION TO THINK THIS WAY?",
      "missing-info": "WHAT INFORMATION IS MISSING?",
    };

    return wrap(narrow(
      <>
        <ChallengeBar text={troubleStatement} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: currentColor }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: currentColor }}>{currentVoice.name}</span>
          </div>
          <span style={{ fontSize: 12, color: "#bbb" }}>Voice {progress}</span>
        </div>

        {/* Original statement always visible as context */}
        <div style={{ marginBottom: 24 }}>
          <Label text="WHAT YOU WROTE" />
          <OriginalText text={currentVoice.originalText} />
        </div>

        <Label text={subLabels[voiceDeepSub]} />

        {/* Volume sub-step */}
        {voiceDeepSub === "volume" && (
          <>
            <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px", lineHeight: 1.5 }}>
              Close your eyes for a moment. Feel into this voice — how loud does it speak right now?<br />Scroll or drag the knob to set its volume.
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
              <VolumeKnob value={currentVoice.volume} onChange={handleVolumeChange} color={currentColor} />
            </div>
            <button onClick={nextVoiceDeepSub} style={{ ...btnSt(currentColor), width: "100%" }}>
              Feels right — continue →
            </button>
          </>
        )}

        {/* Behind sub-step */}
        {voiceDeepSub === "behind" && (
          <>
            <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 12px", lineHeight: 1.5 }}>
              A fear, a past experience, a belief, a bias — what makes this voice {VOLUME_LABELS[currentVoice.volume].toLowerCase()}?
            </p>
            <textarea value={currentVoice.loudnessReflection}
              onChange={e => updateVoice(currentVoice.id, { loudnessReflection: e.target.value })}
              placeholder="Nothing specific comes to mind…"
              rows={3} style={{ ...inputSt(), resize: "none", lineHeight: 1.6 }} autoFocus />
            <button onClick={nextVoiceDeepSub} style={{ ...btnSt("#111"), marginTop: 14, width: "100%" }}>
              Continue →
            </button>
          </>
        )}

        {/* Info sub-step */}
        {voiceDeepSub === "info" && (
          <>
            <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 16px", lineHeight: 1.5 }}>
              Does {currentVoice.name} have a solid basis — or is it operating on incomplete information?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([["yes", "Yes, solid basis", "#1d9e75"], ["partial", "Partly — some gaps", "#e07a3a"], ["no", "Not really — mostly assumptions", "#d4537e"]] as const).map(([val, label, col]) => (
                <button key={val} onClick={() => {
                  updateVoice(currentVoice.id, { infoSufficient: val });
                  if (val === "yes") setTimeout(advanceVoice, 200);
                  else setTimeout(() => setVoiceDeepSub("missing-info"), 200);
                }} style={{ padding: "14px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: `2px solid ${currentVoice.infoSufficient === val ? col : "#eee"}`, background: currentVoice.infoSufficient === val ? `${col}15` : "#fff", color: currentVoice.infoSufficient === val ? col : "#888", textAlign: "left" }}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Missing info sub-step */}
        {voiceDeepSub === "missing-info" && (
          <>
            <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 12px", lineHeight: 1.5 }}>
              What would {currentVoice.name} need to know to think more clearly about this?
            </p>
            <textarea value={currentVoice.missingInfo}
              onChange={e => updateVoice(currentVoice.id, { missingInfo: e.target.value })}
              placeholder="What facts, perspectives or experiences are missing?"
              rows={3} style={{ ...inputSt(), resize: "none", lineHeight: 1.6 }} autoFocus />
            <button onClick={advanceVoice} style={{ ...btnSt("#111"), marginTop: 14, width: "100%" }}>
              {voiceDeepIndex < voices.length - 1 ? "Next voice →" : "See team overview →"}
            </button>
          </>
        )}
      </>
    ));
  }

  // ── STEP: Overview ────────────────────────────────────────────────────────

  if (step === "overview") {
    const obsList = buildSuggestions(voices);
    return wrap(wide(
      <>
        <ChallengeBar text={troubleStatement} />
        <Label text="YOUR INNER TEAM" />
        <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 16px", lineHeight: 1.5 }}>
          Sorted by volume — who is dominating, who is quiet?
        </p>
        <TeamList />

        {obsList.length > 0 && (
          <div style={{ marginTop: 24, background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "18px 22px" }}>
            <Label text="OBSERVATIONS" />
            {obsList.map((obs, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < obsList.length - 1 ? 14 : 0 }}>
                <span style={{ color: "#7c6fcd", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
                <div>
                  <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5, margin: "0 0 4px", fontWeight: 600 }}>{obs.text}</p>
                  {obs.detail && <p style={{ fontSize: 12, color: "#888", lineHeight: 1.55, margin: 0 }}>{obs.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        <PauseBar />
        <ActionOptions />
      </>
    ));
  }

  // ── STEP: Dialogue (one by one) ───────────────────────────────────────────

  if (step === "dialogue") {
    const dv = voices[dialogueIndex];
    const dc = VOICE_COLORS[dialogueIndex % VOICE_COLORS.length];
    const isLast = dialogueIndex === voices.length - 1;
    return wrap(narrow(
      <>
        <ChallengeBar text={troubleStatement} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: dc }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: dc }}>{dv.name}</span>
          </div>
          <span style={{ fontSize: 12, color: "#bbb" }}>{dialogueIndex + 1} / {voices.length}</span>
        </div>

        {/* Context about this voice */}
        <div style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${dc}22`, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: 4, background: dc }} />
          <div style={{ padding: "14px 18px 16px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, background: `${dc}18`, color: dc, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>{VOLUME_LABELS[dv.volume]}</span>
              {dv.infoSufficient && <span style={{ fontSize: 11, color: "#999" }}>Info basis: {dv.infoSufficient === "yes" ? "solid" : dv.infoSufficient === "partial" ? "partial" : "weak"}</span>}
            </div>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: "0 0 10px" }}>{dv.description}</p>
            <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "8px 12px", marginBottom: dv.originalText ? 10 : 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.07em", margin: "0 0 3px" }}>POSITIVE INTENT</p>
              <p style={{ fontSize: 12, color: "#666", margin: 0, lineHeight: 1.45 }}>{dv.positiveIntent}</p>
            </div>
            {dv.originalText && <OriginalText text={dv.originalText} />}
            {dv.loudnessReflection && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.07em", margin: "0 0 3px" }}>BEHIND THE LOUDNESS</p>
                <p style={{ fontSize: 12, color: "#888", margin: 0, lineHeight: 1.45 }}>{dv.loudnessReflection}</p>
              </div>
            )}
          </div>
        </div>

        <Label text="WHAT DO YOU WANT TO SAY TO THIS VOICE?" />
        <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 12px", lineHeight: 1.5 }}>
          As the leader of your inner team — acknowledge, set a limit, integrate, or thank.
        </p>
        <textarea value={dv.userMessage} onChange={e => updateVoice(dv.id, { userMessage: e.target.value })}
          placeholder={`"I hear you…" / "You're too loud right now…" / "I'll bring this in…"`}
          rows={4} autoFocus style={{ ...inputSt(), resize: "none", lineHeight: 1.6 }} />

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {dialogueIndex > 0 && (
            <button onClick={() => setDialogueIndex(i => i - 1)} style={btnSt("#999", true)}>← Back</button>
          )}
          {!isLast ? (
            <button onClick={() => setDialogueIndex(i => i + 1)} style={{ ...btnSt("#111"), flex: 1 }}>Next voice →</button>
          ) : (
            <button onClick={handleGenerateRevised} style={{ ...btnSt("#7c6fcd"), flex: 1 }}>Let the voices respond →</button>
          )}
        </div>
      </>
    ));
  }

  // ── STEP: Generating Revised ──────────────────────────────────────────────

  if (step === "generating-revised") return wrap(narrow(
    <div style={{ textAlign: "center", paddingTop: 40 }}>
      <p style={{ fontSize: 16, color: "#888" }}>Your inner team is responding…</p>
    </div>
  ));

  // ── STEP: After Voices ────────────────────────────────────────────────────

  if (step === "after-voices") return wrap(wide(
    <>
      <ChallengeBar text={troubleStatement} />
      <Label text="YOUR INNER TEAM RESPONDS" />
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px", lineHeight: 1.5 }}>After being heard, each voice has something to say back.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {voices.map((v, i) => {
          const color = VOICE_COLORS[i % VOICE_COLORS.length];
          return (
            <div key={v.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${color}33`, overflow: "hidden" }}>
              <div style={{ height: 4, background: color }} />
              <div style={{ padding: "14px 18px 18px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color, margin: "0 0 10px" }}>{v.name}</p>
                {v.userMessage && (
                  <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#888", lineHeight: 1.4 }}>
                    <strong>You said: </strong>{v.userMessage}
                  </div>
                )}
                {v.revisedPosition && (
                  <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                    &ldquo;{v.revisedPosition}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <PauseBar />
      <ActionOptions />
    </>
  ));

  // ── STEP: Decision ────────────────────────────────────────────────────────

  if (step === "decision") return wrap(narrow(
    <>
      <ChallengeBar text={troubleStatement} />
      <Label text="YOUR BALANCED DECISION" />
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 12px", lineHeight: 1.6 }}>
        Having heard all voices — what is your decision, next step, or direction? Let it reflect the wisdom of the whole team.
      </p>
      <textarea autoFocus value={decision} onChange={e => setDecision(e.target.value)}
        placeholder="My decision / next step is…"
        rows={8} style={{ ...inputSt(), resize: "none", lineHeight: 1.7 }} />
      <button onClick={() => setStep("done")} disabled={!decision.trim()}
        style={{ ...btnSt(decision.trim() ? "#1d9e75" : "#e8e8e8", false, !decision.trim()), marginTop: 14, width: "100%" }}>
        Complete the session →
      </button>

      {/* Toggle: show all voices */}
      <div style={{ marginTop: 28, borderTop: "1px solid #eee", paddingTop: 20 }}>
        <button onClick={() => setShowAllVoices(v => !v)}
          style={{ fontSize: 13, color: "#7c6fcd", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0, fontFamily: font }}>
          {showAllVoices ? "Hide voices ↑" : "Show all voices ↓"}
        </button>

        {showAllVoices && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {voices.map((v, i) => {
              const color = VOICE_COLORS[i % VOICE_COLORS.length];
              return (
                <div key={v.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${color}33`, overflow: "hidden" }}>
                  <div style={{ height: 4, background: color }} />
                  <div style={{ padding: "14px 18px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color }}>{v.name}</span>
                      <span style={{ fontSize: 11, background: `${color}15`, color, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>{VOLUME_LABELS[v.volume]}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5, margin: "0 0 8px" }}>{v.description}</p>
                    <div style={{ background: "#f8f8f8", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.07em", margin: "0 0 3px" }}>POSITIVE INTENT</p>
                      <p style={{ fontSize: 12, color: "#666", margin: 0, lineHeight: 1.4 }}>{v.positiveIntent}</p>
                    </div>
                    {v.originalText && <div style={{ marginBottom: 8 }}><OriginalText text={v.originalText} /></div>}
                    {v.loudnessReflection && (
                      <div style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.07em", margin: "0 0 3px" }}>BEHIND THE LOUDNESS</p>
                        <p style={{ fontSize: 12, color: "#777", margin: 0, lineHeight: 1.4 }}>{v.loudnessReflection}</p>
                      </div>
                    )}
                    {(v.infoSufficient === "partial" || v.infoSufficient === "no") && (
                      <div style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.07em", margin: "0 0 3px" }}>INFORMATION BASIS</p>
                        <p style={{ fontSize: 12, color: "#e07a3a", margin: 0 }}>{v.infoSufficient === "no" ? "Mostly assumptions" : "Partial"}{v.missingInfo ? ` — ${v.missingInfo}` : ""}</p>
                      </div>
                    )}
                    {v.userMessage && (
                      <div style={{ background: "#f0f0f0", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#bbb", letterSpacing: "0.07em", margin: "0 0 3px" }}>YOU SAID</p>
                        <p style={{ fontSize: 12, color: "#555", margin: 0, lineHeight: 1.4 }}>{v.userMessage}</p>
                      </div>
                    )}
                    {v.revisedPosition && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.07em", margin: "0 0 3px" }}>VOICE RESPONDS</p>
                        <p style={{ fontSize: 12, color: "#444", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>&ldquo;{v.revisedPosition}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  ));

  // ── STEP: Done ────────────────────────────────────────────────────────────

  if (step === "done") return wrap(
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
      <div ref={resultRef} style={{ background: "#f7f7f5", padding: 8 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>CHALLENGE</p>
          <p style={{ fontSize: 15, color: "#111", lineHeight: 1.6, margin: 0 }}>{troubleStatement}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10, marginBottom: 14 }}>
          {voices.map((v, i) => {
            const color = VOICE_COLORS[i % VOICE_COLORS.length];
            return (
              <div key={v.id} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${color}33`, overflow: "hidden" }}>
                <div style={{ height: 3, background: color }} />
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{v.name}</span>
                    <span style={{ fontSize: 9, background: `${color}18`, color, borderRadius: 4, padding: "2px 5px" }}>{VOLUME_LABELS[v.volume]}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px", lineHeight: 1.4 }}>{v.positiveIntent}</p>
                  {v.userMessage && (
                    <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
                      <p style={{ fontSize: 10, color: "#bbb", margin: "0 0 3px", fontWeight: 700, letterSpacing: "0.06em" }}>YOU SAID</p>
                      <p style={{ fontSize: 11, color: "#888", margin: "0 0 6px", lineHeight: 1.4 }}>{v.userMessage}</p>
                      {v.revisedPosition && <>
                        <p style={{ fontSize: 10, color, margin: "0 0 3px", fontWeight: 700, letterSpacing: "0.06em" }}>VOICE RESPONDS</p>
                        <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>&ldquo;{v.revisedPosition}&rdquo;</p>
                      </>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #1d9e7533", padding: "18px 22px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#1d9e75", letterSpacing: "0.08em", margin: "0 0 8px" }}>DECISION / NEXT STEP</p>
          <p style={{ fontSize: 15, color: "#111", lineHeight: 1.7, margin: 0 }}>{decision}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={downloadImage} disabled={downloading} style={btnSt("#111", true, downloading)}>
          {downloading ? "Saving…" : "⬇ Save as image"}
        </button>
        <button onClick={handleSave} style={btnSt("#111", true)}>⬇ Save session JSON</button>
      </div>
    </div>
  );

  return wrap(narrow(<p style={{ color: "#aaa" }}>Loading…</p>));
}
