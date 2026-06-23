"use client";

import { useState } from "react";
import Link from "next/link";

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    key: "issue",
    title: "Name the issue",
    subtitle: "Step 1 of 7",
    instruction: "State directly and without preamble what this conversation is about. No small talk — get straight to the point.",
    placeholder: "The issue I want to address is…",
    example: "\"The way our project decisions are being made isn't working.\"",
  },
  {
    key: "example",
    title: "Give a concrete example",
    subtitle: "Step 2 of 7",
    instruction: "Name a specific situation that illustrates the problem. No generalizations — no 'you always' or 'you never'.",
    placeholder: "For example, last [time/day/situation]…",
    example: "\"Last Tuesday's meeting ended without a decision, for the third time in a row.\"",
  },
  {
    key: "feelings",
    title: "Describe your feelings",
    subtitle: "Step 3 of 7",
    instruction: "Say what this situation does to you emotionally. Use 'I' statements — own your feelings.",
    placeholder: "I feel…",
    example: "\"I feel frustrated and genuinely worried about where we're heading.\"",
  },
  {
    key: "consequences",
    title: "Show the consequences",
    subtitle: "Step 4 of 7",
    instruction: "What happens if nothing changes? Be specific about the real impact — on the team, the project, the relationship.",
    placeholder: "If this continues…",
    example: "\"If this continues, we risk losing the client's trust — and the project.\"",
  },
  {
    key: "contribution",
    title: "Name your contribution",
    subtitle: "Step 5 of 7",
    instruction: "Take responsibility for your part. This is not self-blame — it's honesty. It also disarms defensiveness.",
    placeholder: "I contributed to this by…",
    example: "\"I contributed to this by not raising it sooner, which wasn't fair to either of us.\"",
  },
  {
    key: "wish",
    title: "State your wish for resolution",
    subtitle: "Step 6 of 7",
    instruction: "What outcome do you want from this conversation? Be clear and positive.",
    placeholder: "I want us to…",
    example: "\"I want us to find a way forward that works for both of us.\"",
  },
  {
    key: "invitation",
    title: "Invite them to speak",
    subtitle: "Step 7 of 7",
    instruction: "Now you stop talking. Hand the conversation over with an open question — and then stay silent.",
    placeholder: "How do you see this?",
    example: "\"How do you see it?\"  or  \"What's your perspective on this?\"",
  },
] as const;

type StepKey = typeof STEPS[number]["key"];

// ── Colors & helpers ──────────────────────────────────────────────────────────

const COLOR = "#8e44ad";
const FONT  = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function inputSt(): React.CSSProperties {
  return {
    width: "100%", fontSize: 15, padding: "13px 16px", border: "1.5px solid #e0e0e0",
    borderRadius: 12, outline: "none", boxSizing: "border-box", color: "#111",
    fontFamily: FONT, background: "#fff", resize: "none", lineHeight: 1.6,
  };
}

function wrap(content: React.ReactNode) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: FONT }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #eee", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← CommLab</Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Fierce Conversation</span>
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

// ── Intro screen ──────────────────────────────────────────────────────────────

function IntroStep({ onStart }: { onStart: () => void }) {
  return wrap(<>
    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>
      Fierce Conversation
    </h1>
    <p style={{ fontSize: 15, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
      Every conversation can be a turning point. This tool helps you prepare a powerful, direct opening — 60 seconds that change everything.
    </p>
    <div style={{ background: `${COLOR}10`, border: `1.5px solid ${COLOR}30`, borderRadius: 14, padding: "20px 22px", marginBottom: 28 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: COLOR, letterSpacing: "0.06em", margin: "0 0 10px" }}>THE METHOD — SUSAN SCOTT</p>
      <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, margin: "0 0 12px" }}>
        A fierce conversation is one in which we come out from behind ourselves into the conversation and make it real. The model: 7 steps, 60 seconds, then you stop talking.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLOR, minWidth: 18, paddingTop: 1 }}>{i + 1}</span>
            <span style={{ fontSize: 13, color: "#666" }}>{s.title}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "16px 20px", marginBottom: 24 }}>
      <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>
        💡 <strong style={{ color: "#555" }}>Think of a real conversation</strong> you've been putting off — a difficult truth you need to tell someone. Keep that situation in mind as you work through the steps.
      </p>
    </div>
    <button onClick={onStart} style={{
      width: "100%", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: "pointer", border: "none", fontFamily: FONT, background: COLOR, color: "#fff",
    }}>
      Start preparing →
    </button>
  </>);
}

// ── Single step ───────────────────────────────────────────────────────────────

function StepScreen({ stepIndex, inputs, onInput, onNext, onBack }: {
  stepIndex: number;
  inputs: Record<string, string>;
  onInput: (key: string, val: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const step = STEPS[stepIndex];
  const value = inputs[step.key] ?? "";
  const [improving, setImproving] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  async function improve() {
    if (!value.trim()) return;
    setImproving(true);
    setSuggestion("");
    try {
      const res = await fetch("/api/games/fierce-conversation/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepTitle: step.title, stepInstruction: step.instruction, userInput: value }),
      });
      const data = await res.json();
      setSuggestion(data.suggestion);
    } finally { setImproving(false); }
  }

  return wrap(<>
    {/* Progress bar */}
    <div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
      {STEPS.map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIndex ? COLOR : "#e8e8e8", transition: "background 0.3s" }} />
      ))}
    </div>

    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>
      STEP {stepIndex + 1} OF {STEPS.length}
    </p>
    <h2 style={{ fontSize: 22, fontWeight: 700, color: COLOR, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
      {step.title}
    </h2>
    <p style={{ fontSize: 14, color: "#666", margin: "0 0 6px", lineHeight: 1.6 }}>{step.instruction}</p>
    <p style={{ fontSize: 12, color: "#bbb", margin: "0 0 18px", fontStyle: "italic" }}>e.g. {step.example}</p>

    <textarea
      value={value}
      onChange={e => { onInput(step.key, e.target.value); setSuggestion(""); }}
      placeholder={step.placeholder}
      rows={4}
      autoFocus
      style={{ ...inputSt(), marginBottom: 10 }}
    />

    {/* AI improve button */}
    <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}>
      <button
        onClick={improve}
        disabled={!value.trim() || improving}
        style={{
          padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          cursor: value.trim() && !improving ? "pointer" : "not-allowed",
          border: `1.5px solid ${COLOR}40`, background: `${COLOR}08`, color: COLOR, fontFamily: FONT,
          opacity: !value.trim() ? 0.4 : 1,
        }}
      >
        {improving ? "Improving…" : "✦ Make it sharper"}
      </button>
    </div>

    {suggestion && (
      <div style={{ background: `${COLOR}08`, border: `1.5px solid ${COLOR}30`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLOR, letterSpacing: "0.07em", margin: "0 0 6px" }}>SUGGESTED PHRASING</p>
        <p style={{ fontSize: 14, color: "#444", lineHeight: 1.6, margin: "0 0 10px" }}>{suggestion}</p>
        <button
          onClick={() => { onInput(step.key, suggestion); setSuggestion(""); }}
          style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: COLOR, color: "#fff", fontFamily: FONT }}
        >
          Use this →
        </button>
      </div>
    )}

    <div style={{ display: "flex", gap: 10 }}>
      {stepIndex > 0 && (
        <button onClick={onBack} style={{ padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1.5px solid #e0e0e0", background: "#fff", color: "#888", fontFamily: FONT }}>
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!value.trim()}
        style={{
          flex: 1, padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600,
          cursor: value.trim() ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
          background: value.trim() ? COLOR : "#e8e8e8", color: value.trim() ? "#fff" : "#bbb",
        }}
      >
        {stepIndex < STEPS.length - 1 ? "Continue →" : "Build my opening →"}
      </button>
    </div>
  </>);
}

// ── Loading ───────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return wrap(
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ width: 48, height: 48, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize: 15, color: "#888" }}>Crafting your 60-second opening…</p>
    </div>
  );
}

// ── Result ────────────────────────────────────────────────────────────────────

function ResultScreen({ assembled, wordCount, estimatedSeconds, onRestart }: {
  assembled: string; wordCount: number; estimatedSeconds: number; onRestart: () => void;
}) {
  const [text, setText] = useState(assembled);
  const currentWords = text.split(/\s+/).filter(Boolean).length;
  const currentSecs  = Math.round(currentWords / 2.5);
  const isGood = currentWords <= 150;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return wrap(<>
    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>YOUR 60-SECOND OPENING</p>
    <h2 style={{ fontSize: 22, fontWeight: 700, color: COLOR, margin: "0 0 6px", letterSpacing: "-0.3px" }}>
      Your fierce conversation is ready
    </h2>
    <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px" }}>
      Edit freely — then practice it out loud until it feels natural.
    </p>

    {/* Word / time indicator */}
    <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: isGood ? "#1d9e7515" : "#d4537e15", border: `1px solid ${isGood ? "#1d9e7540" : "#d4537e40"}` }}>
        <span style={{ fontSize: 14 }}>{isGood ? "✓" : "⚠"}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: isGood ? "#1d9e75" : "#d4537e" }}>
          ~{currentSecs}s · {currentWords} words
        </span>
      </div>
      {!isGood && <span style={{ fontSize: 12, color: "#d4537e" }}>Over 60s — trim to keep impact</span>}
    </div>

    <textarea
      value={text}
      onChange={e => setText(e.target.value)}
      rows={12}
      style={{ ...inputSt(), marginBottom: 14, fontSize: 15, lineHeight: 1.8 }}
    />

    <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
      <button onClick={copy} style={{
        flex: 1, padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600,
        cursor: "pointer", border: `1.5px solid ${COLOR}50`, background: `${COLOR}08`, color: COLOR, fontFamily: FONT,
      }}>
        {copied ? "Copied ✓" : "Copy to clipboard"}
      </button>
    </div>

    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "16px 20px", marginBottom: 24 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#555", margin: "0 0 6px" }}>Before you go:</p>
      <ul style={{ fontSize: 13, color: "#888", lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
        <li>Practice it out loud — at least twice</li>
        <li>Time yourself: it should be under 60 seconds</li>
        <li>After your opening, stop. Let silence do its work.</li>
        <li>Listen as much as you speak</li>
      </ul>
    </div>

    <div style={{ borderTop: "1px solid #eee", paddingTop: 24 }}>
      <button onClick={onRestart} style={{ width: "100%", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1.5px solid #ddd", background: "#fff", color: "#555", fontFamily: FONT }}>
        ↩ Prepare a different conversation
      </button>
    </div>
  </>);
}

// ── Main ──────────────────────────────────────────────────────────────────────

type AppStep = "intro" | "steps" | "assembling" | "result";

export default function FierceConversationPage() {
  const [appStep, setAppStep]   = useState<AppStep>("intro");
  const [stepIdx, setStepIdx]   = useState(0);
  const [inputs, setInputs]     = useState<Record<string, string>>({});
  const [result, setResult]     = useState<{ assembled: string; wordCount: number; estimatedSeconds: number } | null>(null);

  function handleInput(key: string, val: string) {
    setInputs(p => ({ ...p, [key]: val }));
  }

  async function handleNext() {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(i => i + 1);
    } else {
      // Last step — assemble
      setAppStep("assembling");
      try {
        const steps = STEPS.map(s => ({ key: s.key, title: s.title, input: inputs[s.key] ?? "" }));
        const res = await fetch("/api/games/fierce-conversation/assemble", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ steps }),
        });
        const data = await res.json();
        setResult(data);
        setAppStep("result");
      } catch {
        setAppStep("steps"); // fall back
      }
    }
  }

  function restart() {
    setAppStep("intro"); setStepIdx(0); setInputs({}); setResult(null);
  }

  if (appStep === "intro")      return <IntroStep onStart={() => setAppStep("steps")} />;
  if (appStep === "steps")      return <StepScreen stepIndex={stepIdx} inputs={inputs} onInput={handleInput} onNext={handleNext} onBack={() => setStepIdx(i => i - 1)} />;
  if (appStep === "assembling") return <LoadingScreen />;
  if (appStep === "result" && result) return <ResultScreen {...result} onRestart={restart} />;
  return null;
}
