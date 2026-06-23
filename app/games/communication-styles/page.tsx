"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StyleResult {
  key: string;
  name: string;
  tagline: string;
  description: string;
  strength: string;
}

interface FinalResult {
  needsMore: false;
  dominant: StyleResult;
  coStyle: StyleResult;
  allergy: string;
  coaching: string;
}

interface MoreResult {
  needsMore: true;
  questions: { question: string; options: string[] }[];
}

type AnalysisResult = FinalResult | MoreResult;

type AppStep = "prompt" | "analyzing" | "questions" | "result";

// ── Style metadata ────────────────────────────────────────────────────────────

const STYLE_META: Record<string, { color: string; icon: string; de: string }> = {
  "aggressive-devaluing":      { color: "#d4537e", icon: "⚡", de: "Aggressiv-entwertend" },
  "distancing":                { color: "#378add", icon: "🧊", de: "Sich distanzierend" },
  "selfless":                  { color: "#7c6fcd", icon: "🕊️", de: "Selbstlos" },
  "helping":                   { color: "#1d9e75", icon: "🛠️", de: "Helfend" },
  "needy-dependent":           { color: "#e07a3a", icon: "🌊", de: "Bedürftig-abhängig" },
  "self-proving":              { color: "#639922", icon: "🏆", de: "Sich beweisend" },
  "controlling":               { color: "#c0392b", icon: "📋", de: "Bestimmend-kontrollierend" },
  "expressive-dramatizing":    { color: "#8e44ad", icon: "🎭", de: "Mitteilungsfreudig-dramatisierend" },
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// ── Shared helpers ────────────────────────────────────────────────────────────

function wrap(content: React.ReactNode) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: FONT }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #eee", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← CommLab</Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>8 Communication Styles</span>
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

// ── Voice input hook (MediaRecorder + Whisper) ────────────────────────────────
// Works in Chrome, Firefox, Safari — no dependency on Google Speech servers

function useVoice() {
  const [text, setText]             = useState("");
  const [listening, setListening]   = useState(false);
  const [transcribing, setTransc]   = useState(false);
  const [supported, setSupported]   = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices);
  }, []);

  async function start() {
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      const HALLUCINATIONS = ["bye", "bye.", "thanks for watching", "thank you", "thank you.", "you", "you."];

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setListening(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        if (blob.size < 8000) {
          setVoiceError(`No audio captured (${blob.size} bytes) — check microphone in browser & OS settings`);
          return;
        }

        setTransc(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "recording.webm");
          const res = await fetch("/api/games/communication-styles/transcribe", { method: "POST", body: fd });
          const { text: transcript } = await res.json();
          const cleaned = transcript?.trim() ?? "";
          if (HALLUCINATIONS.includes(cleaned.toLowerCase())) {
            setVoiceError(`Mic captured silence — got "${cleaned}". Check microphone settings.`);
          } else if (cleaned) {
            setText(prev => prev ? prev + " " + cleaned : cleaned);
          }
        } catch {
          setVoiceError("Transcription failed — please try again");
        } finally {
          setTransc(false);
        }
      };
      mr.start();
      mediaRecRef.current = mr;
      setListening(true);
    } catch (e: any) {
      setVoiceError(e.name === "NotAllowedError" ? "Microphone access denied" : "Could not access microphone");
    }
  }

  function stop() {
    mediaRecRef.current?.stop();
  }

  return { text, setText, listening, transcribing, supported, voiceError, start, stop };
}

// ── Prompt step ───────────────────────────────────────────────────────────────

function PromptStep({ onContinue }: { onContinue: (text: string) => void }) {
  const { text, setText, listening, transcribing, supported, voiceError, start, stop } = useVoice();

  return wrap(<>
    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>
      8 Communication Styles
    </h1>
    <p style={{ fontSize: 15, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
      Discover your dominant communication style — and what it reveals about you.
    </p>

    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "22px 24px", marginBottom: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: "0 0 12px", lineHeight: 1.5 }}>
        Think of a situation from the past few weeks that upset, annoyed, or hurt you — a conflict with a partner, a colleague, or in a meeting.
      </p>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 6px", lineHeight: 1.5 }}>
        Close your eyes for a moment: Where were you? Who was there? What was said?
      </p>
      <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>
        Now describe it freely: What exactly happened? What did you think, feel, and how did you react? Don't worry about grammar — just let it flow.
      </p>
    </div>

    <div style={{ position: "relative", marginBottom: 12 }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        readOnly={listening || transcribing}
        placeholder="Describe the situation here…"
        rows={7}
        autoFocus
        style={{
          width: "100%", fontSize: 15, padding: "14px 16px", border: "1.5px solid #e0e0e0",
          borderRadius: 12, outline: "none", boxSizing: "border-box", color: "#111",
          fontFamily: FONT, background: "#fff", resize: "vertical", lineHeight: 1.6,
        }}
      />
      {supported && (
        <button
          onClick={listening ? stop : start}
          title={listening ? "Stop recording" : "Speak instead of typing"}
          style={{
            position: "absolute", bottom: 10, right: 10,
            background: listening ? "#d4537e" : "#fff",
            border: listening ? "none" : "1.5px solid #e0e0e0",
            borderRadius: 10, padding: "9px 14px",
            cursor: "pointer", fontSize: 18, lineHeight: 1,
            transition: "background 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          {listening ? "⏹" : transcribing ? "⟳" : "🎤"}
        </button>
      )}
    </div>
    {listening && (
      <p style={{ fontSize: 12, color: "#d4537e", margin: "0 0 12px", fontWeight: 600 }}>● Recording… tap ⏹ to stop and transcribe</p>
    )}
    {transcribing && (
      <p style={{ fontSize: 12, color: "#639922", margin: "0 0 12px", fontWeight: 600 }}>⟳ Transcribing…</p>
    )}
    {voiceError && (
      <p style={{ fontSize: 12, color: "#d4537e", margin: "0 0 12px" }}>{voiceError}</p>
    )}

    <button
      suppressHydrationWarning
      onClick={() => onContinue(text.trim())}
      disabled={text.trim().length < 30}
      style={{
        width: "100%", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
        cursor: text.trim().length >= 30 ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
        background: text.trim().length >= 30 ? "#639922" : "#e8e8e8",
        color: text.trim().length >= 30 ? "#fff" : "#bbb",
      }}
    >
      Analyze my communication style →
    </button>
  </>);
}

// ── Loading ───────────────────────────────────────────────────────────────────

function LoadingStep() {
  return wrap(
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ width: 48, height: 48, border: "3px solid #63992230", borderTopColor: "#639922", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize: 15, color: "#888" }}>Reading between the lines…</p>
    </div>
  );
}

// ── Questions step ────────────────────────────────────────────────────────────

function QuestionsStep({ questions, onSubmit }: {
  questions: { question: string; options: string[] }[];
  onSubmit: (answers: { question: string; answer: string }[]) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);

  function pick(option: string) {
    const newAnswers = [...answers, { question: questions[current].question, answer: option }];
    setAnswers(newAnswers);
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 200);
    } else {
      setTimeout(() => onSubmit(newAnswers), 200);
    }
  }

  const q = questions[current];

  return wrap(<>
    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 6px" }}>
      QUESTION {current + 1} OF {questions.length}
    </p>
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {questions.map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= current ? "#639922" : "#e8e8e8" }} />
      ))}
    </div>

    <p style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 20px", lineHeight: 1.5 }}>
      {q.question}
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {q.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => pick(opt)}
          style={{
            padding: "14px 18px", borderRadius: 12, fontSize: 14, cursor: "pointer",
            border: "1.5px solid #e8e8e8", background: "#fff", color: "#555",
            textAlign: "left", fontFamily: FONT, lineHeight: 1.4,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "#639922"; (e.target as HTMLElement).style.color = "#639922"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "#e8e8e8"; (e.target as HTMLElement).style.color = "#555"; }}
        >
          {opt}
        </button>
      ))}
    </div>
  </>);
}

// ── Style card ────────────────────────────────────────────────────────────────

function StyleCard({ style, size }: { style: StyleResult; size: "large" | "small" }) {
  const meta = STYLE_META[style.key] ?? { color: "#999", icon: "●", de: "" };
  const isLarge = size === "large";

  return (
    <div style={{
      background: `${meta.color}10`, border: `2px solid ${meta.color}40`,
      borderRadius: 16, padding: isLarge ? "24px 24px" : "16px 20px",
      marginBottom: isLarge ? 16 : 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isLarge ? 14 : 8 }}>
        <span style={{ fontSize: isLarge ? 32 : 22 }}>{meta.icon}</span>
        <div>
          {isLarge && (
            <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: "0.08em", marginBottom: 2 }}>
              DOMINANT STYLE
            </div>
          )}
          {!isLarge && (
            <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: "0.08em", marginBottom: 2 }}>
              CO-STYLE
            </div>
          )}
          <div style={{ fontSize: isLarge ? 20 : 16, fontWeight: 700, color: meta.color, lineHeight: 1.2 }}>
            {style.name}
          </div>
          {meta.de && (
            <div style={{ fontSize: 11, color: meta.color, opacity: 0.6, marginTop: 1 }}>{meta.de}</div>
          )}
        </div>
      </div>
      <p style={{ fontSize: isLarge ? 15 : 13, fontStyle: "italic", color: "#555", margin: "0 0 10px", lineHeight: 1.5, fontWeight: 500 }}>
        „{style.tagline}"
      </p>
      <p style={{ fontSize: 13, color: "#666", margin: "0 0 8px", lineHeight: 1.65 }}>{style.description}</p>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: meta.color, fontWeight: 700, flexShrink: 0 }}>✦</span>
        <p style={{ fontSize: 12, color: meta.color, margin: 0, lineHeight: 1.5 }}>{style.strength}</p>
      </div>
    </div>
  );
}

// ── Result step ───────────────────────────────────────────────────────────────

function ResultStep({ result, onReset }: { result: FinalResult; onReset: () => void }) {
  return wrap(<>
    <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 20px" }}>YOUR COMMUNICATION PROFILE</p>

    <StyleCard style={result.dominant} size="large" />
    <StyleCard style={result.coStyle} size="small" />

    {/* Allergy */}
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "18px 22px", marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 8px" }}>YOUR ALLERGY</p>
      <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, margin: 0 }}>{result.allergy}</p>
    </div>

    {/* Coaching */}
    <div style={{ background: "#63992210", border: "1.5px solid #63992240", borderRadius: 14, padding: "18px 22px", marginBottom: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#639922", letterSpacing: "0.08em", margin: "0 0 8px" }}>YOUR NEXT STEP</p>
      <p style={{ fontSize: 14, color: "#444", lineHeight: 1.65, margin: 0 }}>{result.coaching}</p>
    </div>

    <div style={{ borderTop: "1px solid #eee", paddingTop: 24 }}>
      <button onClick={onReset} style={{
        width: "100%", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
        cursor: "pointer", border: "1.5px solid #ddd", background: "#fff", color: "#555", fontFamily: FONT,
      }}>
        ↩ Try with a different situation
      </button>
    </div>
  </>);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CommunicationStylesPage() {
  const [step, setStep]           = useState<AppStep>("prompt");
  const [description, setDesc]    = useState("");
  const [questions, setQuestions] = useState<{ question: string; options: string[] }[]>([]);
  const [result, setResult]       = useState<FinalResult | null>(null);
  const [error, setError]         = useState("");

  async function analyze(desc: string, followUpAnswers?: { question: string; answer: string }[]) {
    setStep("analyzing");
    setError("");
    try {
      const res = await fetch("/api/games/communication-styles/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, followUpAnswers }),
      });
      if (!res.ok) throw new Error();
      const data: AnalysisResult = await res.json();

      if (data.needsMore) {
        setQuestions(data.questions);
        setStep("questions");
      } else {
        setResult(data);
        setStep("result");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("prompt");
    }
  }

  function handlePrompt(text: string) {
    setDesc(text);
    analyze(text);
  }

  function handleAnswers(answers: { question: string; answer: string }[]) {
    analyze(description, answers);
  }

  function reset() {
    setStep("prompt"); setDesc(""); setQuestions([]); setResult(null); setError("");
  }

  return (
    <>
      {step === "prompt"    && <PromptStep onContinue={handlePrompt} />}
      {step === "analyzing" && <LoadingStep />}
      {step === "questions" && <QuestionsStep questions={questions} onSubmit={handleAnswers} />}
      {step === "result"    && result && <ResultStep result={result} onReset={reset} />}
      {error && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#d4537e", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 100 }}>
          {error}
        </div>
      )}
    </>
  );
}
