"use client";

import { useState } from "react";
import Link from "next/link";

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    key: "observation",
    title: "Observation",
    subtitle: "Step 1 of 4",
    instruction: "Describe what happened — purely factual, like a camera recording. No judgment, evaluation, or interpretation. No 'always', 'never', 'you are...'.",
    placeholder: "When I see / hear / notice…",
    example: "\"When I see the report sent to the client without my review…\"",
    starter: "When I observe…",
  },
  {
    key: "feeling",
    title: "Feeling",
    subtitle: "Step 2 of 4",
    instruction: "How does this make you feel? Use genuine feeling words. Avoid pseudo-feelings that hide judgments: 'I feel ignored / manipulated / disrespected' are interpretations, not feelings.",
    placeholder: "I feel…",
    example: "\"I feel anxious and frustrated…\"",
    starter: "I feel…",
  },
  {
    key: "need",
    title: "Need",
    subtitle: "Step 3 of 4",
    instruction: "What universal need is unmet? Think deeper than the situation — connection, safety, respect, autonomy, fairness, order, clarity... These are needs, not strategies.",
    placeholder: "…because I need / value…",
    example: "\"…because I need to be included in decisions that affect my work.\"",
    starter: "…because I need…",
  },
  {
    key: "request",
    title: "Request",
    subtitle: "Step 4 of 4",
    instruction: "Make a specific, positive, actionable request. Say what you DO want — not what you don't. Frame it as a genuine request the other person can say no to.",
    placeholder: "Would you be willing to…",
    example: "\"Would you be willing to check with me before sending client-facing documents?\"",
    starter: "Would you be willing to…",
  },
] as const;

type StepKey = typeof STEPS[number]["key"];

// ── Colors & helpers ──────────────────────────────────────────────────────────

const COLOR = "#16a085";
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
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Nonviolent Communication</span>
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

// ── Intro ─────────────────────────────────────────────────────────────────────

function IntroStep({ onStart }: { onStart: () => void }) {
  return wrap(<>
    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>
      Nonviolent Communication
    </h1>
    <p style={{ fontSize: 15, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
      Prepare a difficult message with honesty and empathy — using Marshall Rosenberg's 4-step model.
    </p>
    <div style={{ background: `${COLOR}10`, border: `1.5px solid ${COLOR}30`, borderRadius: 14, padding: "20px 22px", marginBottom: 28 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: COLOR, letterSpacing: "0.06em", margin: "0 0 10px" }}>THE 4 STEPS — MARSHALL ROSENBERG</p>
      {STEPS.map((s, i) => (
        <div key={s.key} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < STEPS.length - 1 ? 12 : 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLOR, minWidth: 18, paddingTop: 1 }}>{i + 1}</span>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>{s.title}</span>
            <span style={{ fontSize: 13, color: "#888" }}> — {s.instruction.split(".")[0]}.</span>
          </div>
        </div>
      ))}
    </div>
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "16px 20px", marginBottom: 24 }}>
      <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>
        💡 <strong style={{ color: "#555" }}>Think of a specific situation</strong> — a conflict, unease, or need that's gone unspoken. Keep it in mind as you work through the steps.
      </p>
    </div>
    <button onClick={onStart} style={{
      width: "100%", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: "pointer", border: "none", fontFamily: FONT, background: COLOR, color: "#fff",
    }}>
      Start →
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
      const res = await fetch("/api/games/nonviolent-communication/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepKey: step.key, stepTitle: step.title, userInput: value }),
      });
      const data = await res.json();
      setSuggestion(data.suggestion);
    } finally { setImproving(false); }
  }

  return wrap(<>
    {/* Progress */}
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

    <div style={{ marginBottom: 16 }}>
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
        {improving ? "Checking…" : "✦ Check NVC alignment"}
      </button>
    </div>

    {suggestion && (
      <div style={{ background: `${COLOR}08`, border: `1.5px solid ${COLOR}30`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLOR, letterSpacing: "0.07em", margin: "0 0 6px" }}>NVC-ALIGNED VERSION</p>
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
        {stepIndex < STEPS.length - 1 ? "Continue →" : "See my NVC message →"}
      </button>
    </div>
  </>);
}

// ── Result ────────────────────────────────────────────────────────────────────

function ResultScreen({ initialInputs, onRestart }: {
  initialInputs: Record<string, string>;
  onRestart: () => void;
}) {
  const [sections, setSections] = useState<Record<string, string>>(initialInputs);
  const [copied, setCopied] = useState(false);

  function copyAll() {
    const text = STEPS.map((s, i) => `${i + 1}. ${s.title}\n${sections[s.key] ?? ""}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return wrap(<>
    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>YOUR NVC MESSAGE</p>
    <h2 style={{ fontSize: 22, fontWeight: 700, color: COLOR, margin: "0 0 6px", letterSpacing: "-0.3px" }}>
      Your message is ready
    </h2>
    <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px" }}>
      Edit any section — then practice saying it out loud before the conversation.
    </p>

    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
      {STEPS.map((step, i) => (
        <div key={step.key} style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #eee", overflow: "hidden" }}>
          <div style={{ background: `${COLOR}08`, borderBottom: "1px solid #eee", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLOR, background: `${COLOR}20`, borderRadius: 6, padding: "2px 8px" }}>{i + 1}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{step.title}</span>
          </div>
          <textarea
            value={sections[step.key] ?? ""}
            onChange={e => setSections(p => ({ ...p, [step.key]: e.target.value }))}
            rows={2}
            style={{ ...inputSt(), border: "none", borderRadius: 0, fontSize: 14, padding: "12px 16px", lineHeight: 1.6 }}
          />
        </div>
      ))}
    </div>

    <button onClick={copyAll} style={{
      width: "100%", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600,
      cursor: "pointer", border: `1.5px solid ${COLOR}50`, background: `${COLOR}08`, color: COLOR, fontFamily: FONT, marginBottom: 20,
    }}>
      {copied ? "Copied ✓" : "Copy all to clipboard"}
    </button>

    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "16px 20px", marginBottom: 24 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#555", margin: "0 0 6px" }}>Before you go:</p>
      <ul style={{ fontSize: 13, color: "#888", lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
        <li>Say it out loud — check that it sounds like you</li>
        <li>After the request, stay curious: listen to the response</li>
        <li>NVC is a conversation, not a script — be ready to adapt</li>
      </ul>
    </div>

    <div style={{ borderTop: "1px solid #eee", paddingTop: 24 }}>
      <button onClick={onRestart} style={{ width: "100%", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1.5px solid #ddd", background: "#fff", color: "#555", fontFamily: FONT }}>
        ↩ Prepare a different message
      </button>
    </div>
  </>);
}

// ── Main ──────────────────────────────────────────────────────────────────────

type AppStep = "intro" | "steps" | "result";

export default function NVCPage() {
  const [appStep, setAppStep] = useState<AppStep>("intro");
  const [stepIdx, setStepIdx] = useState(0);
  const [inputs, setInputs]   = useState<Record<string, string>>({});
  const [finalInputs, setFinalInputs] = useState<Record<string, string>>({});

  function handleInput(key: string, val: string) {
    setInputs(p => ({ ...p, [key]: val }));
  }

  function handleNext() {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(i => i + 1);
    } else {
      setFinalInputs(inputs);
      setAppStep("result");
    }
  }

  function restart() {
    setAppStep("intro"); setStepIdx(0); setInputs({}); setFinalInputs({});
  }

  if (appStep === "intro")  return <IntroStep onStart={() => setAppStep("steps")} />;
  if (appStep === "steps")  return <StepScreen stepIndex={stepIdx} inputs={inputs} onInput={handleInput} onNext={handleNext} onBack={() => setStepIdx(i => i - 1)} />;
  if (appStep === "result") return <ResultScreen initialInputs={finalInputs} onRestart={restart} />;
  return null;
}
