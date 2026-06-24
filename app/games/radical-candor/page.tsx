"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Scenario { you: string; other: string; observation: string; }

interface Evaluation {
  careScore: number; challengeScore: number;
  quadrant: string; quadrantLabel: string; status: "green"|"yellow"|"red";
  howTheyFeel: string; coaching: string[]; summary: string;
}

type AppStep = "loading-scenario" | "input" | "evaluating" | "result";

// ── Colors ────────────────────────────────────────────────────────────────────

const COLOR  = "#e91e63";
const FONT   = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const QUADRANT_CONFIG = {
  "radical-candor":       { color: "#1d9e75", bg: "#1d9e7512", label: "Radical Candor" },
  "ruinous-empathy":      { color: "#e07a3a", bg: "#e07a3a12", label: "Ruinous Empathy" },
  "obnoxious-aggression": { color: "#d4537e", bg: "#d4537e12", label: "Obnoxious Aggression" },
  "manipulative-insincerity": { color: "#7c6fcd", bg: "#7c6fcd12", label: "Manipulative Insincerity" },
};

const STATUS_COLORS = { green: "#1d9e75", yellow: "#e07a3a", red: "#d4537e" };
const STATUS_BG     = { green: "#1d9e7515", yellow: "#e07a3a15", red: "#d4537e15" };
const STATUS_EMOJI  = { green: "🟢", yellow: "🟡", red: "🔴" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputSt(rows?: number): React.CSSProperties {
  return { width:"100%", fontSize:14, padding:"12px 16px", border:"1.5px solid #e0e0e0", borderRadius:12, outline:"none", boxSizing:"border-box", color:"#111", fontFamily:FONT, background:"#fff", resize:rows ? "none" : undefined, lineHeight:1.6 };
}

function wrap(content: React.ReactNode) {
  return (
    <div style={{ minHeight:"100vh", background:"#f7f7f5", fontFamily:FONT }}>
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:10, background:"#fff", borderBottom:"1px solid #eee", padding:"0 28px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link href="/" style={{ fontSize:13, color:"#999", textDecoration:"none" }}>← CommLab</Link>
        <span style={{ fontSize:14, fontWeight:600, color:"#111" }}>Feedback Training</span>
        <span />
      </div>
      <div style={{ paddingTop:52 }}>
        <div style={{ maxWidth:600, margin:"0 auto", padding:"48px 24px 80px" }}>
          {content}
        </div>
      </div>
    </div>
  );
}

// ── Radical Candor Matrix SVG ─────────────────────────────────────────────────

function RCMatrix({ careScore, challengeScore }: { careScore: number; challengeScore: number }) {
  // Map scores (0–10) to SVG coordinates
  // X: careScore → 40 (left/low) to 280 (right/high)
  // Y: challengeScore → 240 (bottom/low) to 40 (top/high) — inverted
  const x = 40 + (careScore / 10) * 240;
  const y = 240 - (challengeScore / 10) * 200;

  return (
    <svg viewBox="0 0 320 280" style={{ width:"100%", maxWidth:320, display:"block", margin:"0 auto" }}>
      {/* Quadrant backgrounds */}
      <rect x="40" y="40"  width="120" height="100" rx="6" fill="#d4537e08" stroke="#d4537e30" strokeWidth="1"/>
      <rect x="160" y="40" width="120" height="100" rx="6" fill="#1d9e7508" stroke="#1d9e7530" strokeWidth="1"/>
      <rect x="40" y="140" width="120" height="100" rx="6" fill="#7c6fcd08" stroke="#7c6fcd30" strokeWidth="1"/>
      <rect x="160" y="140" width="120" height="100" rx="6" fill="#e07a3a08" stroke="#e07a3a30" strokeWidth="1"/>

      {/* Quadrant labels */}
      <text x="100" y="85"  textAnchor="middle" fontSize="9" fontWeight="700" fill="#d4537e" letterSpacing="0.04em">OBNOXIOUS</text>
      <text x="100" y="97"  textAnchor="middle" fontSize="9" fontWeight="700" fill="#d4537e" letterSpacing="0.04em">AGGRESSION</text>
      <text x="220" y="85"  textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d9e75" letterSpacing="0.04em">RADICAL</text>
      <text x="220" y="97"  textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d9e75" letterSpacing="0.04em">CANDOR ★</text>
      <text x="100" y="185" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c6fcd" letterSpacing="0.04em">MANIPULATIVE</text>
      <text x="100" y="197" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c6fcd" letterSpacing="0.04em">INSINCERITY</text>
      <text x="220" y="185" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e07a3a" letterSpacing="0.04em">RUINOUS</text>
      <text x="220" y="197" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e07a3a" letterSpacing="0.04em">EMPATHY</text>

      {/* Axes */}
      <line x1="40" y1="140" x2="280" y2="140" stroke="#ddd" strokeWidth="1.5"/>
      <line x1="160" y1="40" x2="160" y2="240" stroke="#ddd" strokeWidth="1.5"/>

      {/* Axis labels */}
      <text x="160" y="262" textAnchor="middle" fontSize="9" fill="#aaa" fontWeight="600">← CARE PERSONALLY →</text>
      <text x="14" y="140" textAnchor="middle" fontSize="9" fill="#aaa" fontWeight="600" transform="rotate(-90,14,140)">← CHALLENGE DIRECTLY →</text>

      {/* Score dot */}
      <circle cx={x} cy={y} r="10" fill={COLOR} opacity="0.9"/>
      <circle cx={x} cy={y} r="4" fill="white"/>
    </svg>
  );
}

// ── Voice hook (same as communication styles) ─────────────────────────────────

function useVoice(appendText: (t: string) => void) {
  const [listening, setListening]   = useState(false);
  const [transcribing, setTransc]   = useState(false);
  const [supported, setSupported]   = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const mediaRecRef = useRef<MediaRecorder|null>(null);
  const chunksRef   = useRef<Blob[]>([]);

  useEffect(() => { setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices); }, []);

  async function start() {
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setListening(false);
        const blob = new Blob(chunksRef.current, { type:"audio/webm" });
        if (blob.size < 8000) { setVoiceError("No audio captured — check microphone"); return; }
        setTransc(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "recording.webm");
          const res = await fetch("/api/games/communication-styles/transcribe", { method:"POST", body:fd });
          const { text } = await res.json();
          if (text?.trim()) appendText(text.trim());
          else setVoiceError("Couldn't transcribe — please try again");
        } catch { setVoiceError("Transcription failed"); }
        finally { setTransc(false); }
      };
      mr.start(); mediaRecRef.current = mr; setListening(true);
    } catch (e: unknown) {
      setVoiceError((e as Error)?.name === "NotAllowedError" ? "Microphone access denied" : "Could not access microphone");
    }
  }

  function stop() { mediaRecRef.current?.stop(); }

  return { listening, transcribing, supported, voiceError, start, stop };
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RadicalCandorPage() {
  const [step, setStep]         = useState<AppStep>("loading-scenario");
  const [scenario, setScenario] = useState<Scenario|null>(null);
  const [feedback, setFeedback] = useState("");
  const [evaluation, setEval]   = useState<Evaluation|null>(null);
  const [improved, setImproved] = useState("");
  const [loadingImprove, setLoadingImprove] = useState(false);

  const { listening, transcribing, supported, voiceError, start, stop } = useVoice(t => setFeedback(p => p ? p+" "+t : t));

  async function loadScenario() {
    setStep("loading-scenario");
    setFeedback(""); setEval(null); setImproved("");
    const res = await fetch("/api/games/radical-candor/scenario");
    const s = await res.json();
    setScenario(s); setStep("input");
  }

  async function evaluate() {
    if (!scenario || !feedback.trim()) return;
    setStep("evaluating");
    const res = await fetch("/api/games/radical-candor/evaluate", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ you: scenario.you, other: scenario.other, observation: scenario.observation, feedback }),
    });
    const ev = await res.json();
    setEval(ev); setStep("result");
  }

  async function getImproved() {
    if (!scenario || !evaluation) return;
    setLoadingImprove(true);
    const res = await fetch("/api/games/radical-candor/improve", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ you: scenario.you, other: scenario.other, observation: scenario.observation, feedback, quadrant: evaluation.quadrant }),
    });
    const { improved: imp } = await res.json();
    setImproved(imp); setLoadingImprove(false);
  }

  // Auto-load on mount
  useEffect(() => { loadScenario(); }, []);

  // ── Loading ──
  if (step === "loading-scenario") return wrap(
    <div style={{ textAlign:"center", padding:"60px 0" }}>
      <div style={{ width:48, height:48, border:`3px solid ${COLOR}30`, borderTopColor:COLOR, borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 20px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize:15, color:"#888" }}>Preparing your scenario…</p>
    </div>
  );

  // ── Input ──
  if (step === "input" && scenario) return wrap(<>
    <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 6px" }}>YOUR SCENARIO</p>
    <div style={{ background:"#fff", borderRadius:14, border:`1.5px solid ${COLOR}30`, padding:"18px 20px", marginBottom:24 }}>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, fontWeight:700, color:"#fff", background:COLOR, borderRadius:8, padding:"3px 10px" }}>You: {scenario.you}</span>
        <span style={{ fontSize:12, fontWeight:700, color:COLOR, background:`${COLOR}15`, border:`1px solid ${COLOR}30`, borderRadius:8, padding:"3px 10px" }}>Talking to: {scenario.other}</span>
      </div>
      <p style={{ fontSize:14, color:"#555", lineHeight:1.7, margin:0 }}>{scenario.observation}</p>
    </div>

    <p style={{ fontSize:13, fontWeight:600, color:"#333", margin:"0 0 10px" }}>How would you give this feedback?</p>

    <div style={{ position:"relative", marginBottom:10 }}>
      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="Type your feedback here, or use the mic to speak it…"
        rows={5}
        readOnly={listening || transcribing}
        style={{ ...inputSt(5) }}
      />
      {supported && (
        <button onClick={listening ? stop : start} style={{
          position:"absolute", bottom:10, right:10, borderRadius:10, padding:"8px 12px",
          fontSize:17, border: listening ? "none" : "1.5px solid #e0e0e0",
          background: listening ? "#d4537e" : "#fff", cursor:"pointer",
          boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
        }}>{listening ? "⏹" : transcribing ? "⟳" : "🎤"}</button>
      )}
    </div>
    {listening  && <p style={{ fontSize:12, color:"#d4537e", margin:"0 0 10px", fontWeight:600 }}>● Recording… tap ⏹ when done</p>}
    {transcribing && <p style={{ fontSize:12, color:"#639922", margin:"0 0 10px", fontWeight:600 }}>⟳ Transcribing…</p>}
    {voiceError && <p style={{ fontSize:12, color:"#d4537e", margin:"0 0 10px" }}>{voiceError}</p>}

    <button onClick={evaluate} disabled={!feedback.trim()} style={{
      width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:600,
      cursor:feedback.trim() ? "pointer" : "not-allowed", border:"none", fontFamily:FONT,
      background:feedback.trim() ? COLOR : "#e8e8e8", color:feedback.trim() ? "#fff" : "#bbb",
    }}>
      Evaluate my feedback →
    </button>
  </>);

  // ── Evaluating ──
  if (step === "evaluating") return wrap(
    <div style={{ textAlign:"center", padding:"60px 0" }}>
      <div style={{ width:48, height:48, border:`3px solid ${COLOR}30`, borderTopColor:COLOR, borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 20px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize:15, color:"#888" }}>Analyzing your feedback…</p>
    </div>
  );

  // ── Result ──
  if (step === "result" && scenario && evaluation) {
    const qCfg = QUADRANT_CONFIG[evaluation.quadrant as keyof typeof QUADRANT_CONFIG] ?? QUADRANT_CONFIG["radical-candor"];
    const sc   = evaluation.status;

    return wrap(<>
      {/* Traffic light + quadrant */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ background:STATUS_BG[sc], border:`2px solid ${STATUS_COLORS[sc]}50`, borderRadius:12, padding:"12px 18px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <span style={{ fontSize:28, lineHeight:1 }}>{STATUS_EMOJI[sc]}</span>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:STATUS_COLORS[sc], letterSpacing:"0.05em" }}>
              {sc === "green" ? "RADICAL CANDOR ZONE" : sc === "yellow" ? "ALMOST THERE" : "NEEDS WORK"}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:qCfg.color }}>{evaluation.quadrantLabel}</div>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #eee", padding:"16px", marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 12px" }}>YOUR POSITION</p>
        <RCMatrix careScore={evaluation.careScore} challengeScore={evaluation.challengeScore} />
        <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:10 }}>
          <span style={{ fontSize:12, color:"#888" }}>Care: <strong style={{ color:COLOR }}>{evaluation.careScore}/10</strong></span>
          <span style={{ fontSize:12, color:"#888" }}>Challenge: <strong style={{ color:COLOR }}>{evaluation.challengeScore}/10</strong></span>
        </div>
      </div>

      {/* Summary */}
      <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #eee", padding:"16px 20px", marginBottom:14 }}>
        <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 6px" }}>SUMMARY</p>
        <p style={{ fontSize:14, color:"#555", lineHeight:1.65, margin:0 }}>{evaluation.summary}</p>
      </div>

      {/* How they feel */}
      <div style={{ background:`${COLOR}08`, border:`1.5px solid ${COLOR}25`, borderRadius:14, padding:"16px 20px", marginBottom:14 }}>
        <p style={{ fontSize:11, fontWeight:700, color:COLOR, letterSpacing:"0.08em", margin:"0 0 6px" }}>HOW YOUR {scenario.other.toUpperCase()} MIGHT FEEL</p>
        <p style={{ fontSize:14, color:"#444", lineHeight:1.65, margin:0 }}>{evaluation.howTheyFeel}</p>
      </div>

      {/* Coaching tips */}
      <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #eee", padding:"16px 20px", marginBottom:20 }}>
        <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 10px" }}>COACHING TIPS</p>
        {evaluation.coaching.map((tip, i) => (
          <div key={i} style={{ display:"flex", gap:10, marginBottom: i < evaluation.coaching.length-1 ? 10 : 0 }}>
            <span style={{ color:COLOR, fontWeight:700, flexShrink:0 }}>→</span>
            <p style={{ fontSize:13, color:"#555", lineHeight:1.6, margin:0 }}>{tip}</p>
          </div>
        ))}
      </div>

      {/* Improved version */}
      {!improved && (
        <button onClick={getImproved} disabled={loadingImprove} style={{ width:"100%", padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:`1.5px solid ${COLOR}50`, background:`${COLOR}08`, color:COLOR, fontFamily:FONT, marginBottom:12 }}>
          {loadingImprove ? "Generating…" : "✦ See a Radical Candor version →"}
        </button>
      )}
      {improved && (
        <div style={{ background:"#1d9e7510", border:"1.5px solid #1d9e7540", borderRadius:14, padding:"16px 20px", marginBottom:12 }}>
          <p style={{ fontSize:11, fontWeight:700, color:"#1d9e75", letterSpacing:"0.08em", margin:"0 0 8px" }}>RADICAL CANDOR VERSION</p>
          <p style={{ fontSize:14, color:"#444", lineHeight:1.7, margin:0, fontStyle:"italic" }}>{improved}</p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display:"flex", gap:10, borderTop:"1px solid #eee", paddingTop:20 }}>
        <button onClick={() => { setFeedback(""); setEval(null); setImproved(""); setStep("input"); }} style={{ flex:1, padding:"12px", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", border:"1.5px solid #ddd", background:"#fff", color:"#555", fontFamily:FONT }}>
          ↩ Same scenario
        </button>
        <button onClick={loadScenario} style={{ flex:1, padding:"12px", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", fontFamily:FONT, background:COLOR, color:"#fff" }}>
          New scenario →
        </button>
      </div>
    </>);
  }

  return null;
}
