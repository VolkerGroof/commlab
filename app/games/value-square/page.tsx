"use client";

import { useState } from "react";
import Link from "next/link";

const COLOR = "#e07a3a";
const COLOR2 = "#7c6fcd";

interface SquareData {
  primaryValue: string;
  complementaryValue: string;
  excessPrimary: string;
  excessComplementary: string;
  direction1: string;
  direction2: string;
}

type Step = "enter" | "analyzing" | "pick" | "building" | "square";

// ── Style helpers ─────────────────────────────────────────────────────────────

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function inputSt(): React.CSSProperties {
  return {
    width: "100%", fontSize: 15, padding: "13px 16px",
    border: "1.5px solid #e0e0e0", borderRadius: 12, outline: "none",
    boxSizing: "border-box", color: "#111", fontFamily: FONT, background: "#fff",
  };
}

function btnSt(color: string, outlined?: boolean, disabled?: boolean): React.CSSProperties {
  return {
    padding: "12px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: FONT,
    border: outlined ? `1.5px solid ${color}50` : "none",
    background: disabled ? "#e8e8e8" : outlined ? `${color}08` : color,
    color: disabled ? "#bbb" : outlined ? color : "#fff",
  };
}

function Label({ text }: { text: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 8px" }}>{text}</p>;
}

function wrap(content: React.ReactNode) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: FONT }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #eee", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← CommLab</Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>The Value Square</span>
        <span />
      </div>
      <div style={{ paddingTop: 52 }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "56px 24px 80px" }}>
          {content}
        </div>
      </div>
    </div>
  );
}

// ── Enter step ────────────────────────────────────────────────────────────────

function EnterStep({ value, onChange, onContinue }: {
  value: string; onChange: (v: string) => void; onContinue: () => void;
}) {
  return wrap(<>
    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>The Value Square</h1>
    <p style={{ fontSize: 15, color: "#888", margin: "0 0 32px", lineHeight: 1.6 }}>
      Name a value that matters to you — one you want to explore and bring into balance.
    </p>
    <Label text="YOUR VALUE" />
    <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 10px", lineHeight: 1.5 }}>
      Which value do you identify with strongly? (e.g. "Sorgfalt", "Stärke", "Direktheit")
    </p>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter" && value.trim()) onContinue(); }}
      placeholder="e.g. Sorgfalt, Openness, Strength…"
      autoFocus
      style={{ ...inputSt(), marginBottom: 14 }}
    />
    <button onClick={onContinue} disabled={!value.trim()} style={{ ...btnSt(COLOR, false, !value.trim()), width: "100%" }}>
      Find complementary values →
    </button>
  </>);
}

// ── Loading step ──────────────────────────────────────────────────────────────

function LoadingStep({ text }: { text: string }) {
  return wrap(
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${COLOR}30`, borderTopColor: COLOR, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 15, color: "#888" }}>{text}</p>
    </div>
  );
}

// ── Pick step ─────────────────────────────────────────────────────────────────

function PickStep({ primaryValue, suggestions, onPick }: {
  primaryValue: string; suggestions: string[]; onPick: (v: string) => void;
}) {
  return wrap(<>
    <Label text="YOUR VALUE" />
    <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: `1.5px solid ${COLOR}40`, marginBottom: 28 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: COLOR }}>{primaryValue}</span>
    </div>

    <Label text="COMPLEMENTARY VALUES" />
    <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 14px", lineHeight: 1.5 }}>
      Every value needs a healthy counterpart to stay in balance. Which of these feels like the right complement to <strong style={{ color: "#555" }}>{primaryValue}</strong>?
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onPick(s)} style={{
          padding: "16px 20px", borderRadius: 12, fontSize: 15, fontWeight: 600,
          cursor: "pointer", border: `1.5px solid ${COLOR2}40`,
          background: "#fff", color: COLOR2, textAlign: "left", fontFamily: FONT,
        }}>
          {s}
        </button>
      ))}
    </div>
  </>);
}

// ── Value Square visual ───────────────────────────────────────────────────────

function ValueSquareVisual({ data }: { data: SquareData }) {
  const quads = [
    { label: data.primaryValue, sub: "YOUR VALUE", color: COLOR, positive: true, corner: "12px 0 0 0" },
    { label: data.complementaryValue, sub: "SISTER VALUE", color: COLOR2, positive: true, corner: "0 12px 0 0" },
    { label: data.excessPrimary, sub: "WHEN OVERDONE", color: COLOR, positive: false, corner: "0 0 0 12px" },
    { label: data.excessComplementary, sub: "WHEN OVERDONE", color: COLOR2, positive: false, corner: "0 0 12px 0" },
  ];

  return (
    <div style={{ position: "relative", width: "100%", marginBottom: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {quads.map((q, i) => (
          <div key={i} style={{
            padding: "22px 16px", minHeight: 120,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: q.positive ? `${q.color}10` : "#f5f5f5",
            border: `1.5px solid ${q.positive ? `${q.color}50` : "#e0e0e0"}`,
            borderRadius: q.corner,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: q.positive ? q.color : "#ccc", letterSpacing: "0.07em", marginBottom: 8, textAlign: "center" }}>
              {q.sub}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: q.positive ? q.color : "#aaa", textAlign: "center", lineHeight: 1.3 }}>
              {q.label}
            </div>
          </div>
        ))}
      </div>

      {/* SVG diagonal arrows overlay */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <marker id="va1" markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill={COLOR2} opacity="0.7" />
          </marker>
          <marker id="va2" markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill={COLOR} opacity="0.7" />
          </marker>
        </defs>
        {/* Direction 1: BL (excess primary) → TR (complementary value) */}
        <line x1="20" y1="83" x2="80" y2="20"
          stroke={COLOR2} strokeWidth="0.7" strokeDasharray="4 2.5"
          markerEnd="url(#va1)" opacity="0.65" />
        {/* Direction 2: BR (excess complementary) → TL (primary value) */}
        <line x1="80" y1="83" x2="20" y2="20"
          stroke={COLOR} strokeWidth="0.7" strokeDasharray="4 2.5"
          markerEnd="url(#va2)" opacity="0.65" />
        {/* Center dot */}
        <circle cx="50" cy="50" r="2.5" fill="white" stroke="#ccc" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

// ── Direction card ────────────────────────────────────────────────────────────

function DirectionCard({ nr, color, fromExcess, towardValue, description }: {
  nr: number; color: string; fromExcess: string; towardValue: string; description: string;
}) {
  return (
    <div style={{ background: `${color}08`, border: `1.5px solid ${color}30`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.07em", marginBottom: 8 }}>
        DEVELOPMENT DIRECTION {nr}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>
        <span style={{ color, opacity: 0.8 }}>{fromExcess}</span>
        <span style={{ color: "#ccc", margin: "0 6px" }}>→</span>
        <span style={{ color }}>{towardValue}</span>
      </div>
      <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{description}</div>
    </div>
  );
}

// ── Development section ───────────────────────────────────────────────────────

function DevelopmentSection({ nr, color, fromExcess, towardValue, description, steps, onSteps, suggestions, loading, onGetSuggestions }: {
  nr: number; color: string; fromExcess: string; towardValue: string; description: string;
  steps: string; onSteps: (v: string) => void;
  suggestions: string[]; loading: boolean; onGetSuggestions: () => void;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Label text={`DEVELOPMENT DIRECTION ${nr} — MY STEPS`} />
      <div style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${color}25`, overflow: "hidden" }}>
        <div style={{ background: `${color}07`, padding: "12px 18px", borderBottom: `1px solid ${color}15` }}>
          <span style={{ fontSize: 12, color, fontWeight: 600 }}>{fromExcess}</span>
          <span style={{ fontSize: 12, color: "#ccc", margin: "0 6px" }}>→</span>
          <span style={{ fontSize: 12, color, fontWeight: 600 }}>{towardValue}</span>
          <p style={{ fontSize: 12, color: "#999", margin: "4px 0 0", lineHeight: 1.4 }}>{description}</p>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <textarea
            value={steps}
            onChange={e => onSteps(e.target.value)}
            placeholder="What concrete steps could I take…"
            rows={3}
            style={{ ...inputSt(), resize: "none", lineHeight: 1.6, fontSize: 14 }}
          />
          <button
            onClick={onGetSuggestions}
            disabled={loading}
            style={{ ...btnSt(color, true, loading), marginTop: 10 }}
          >
            {loading ? "Loading suggestions…" : "Get suggestions →"}
          </button>

          {suggestions.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: "0.07em", marginBottom: 8 }}>VORSCHLÄGE — klicken zum Übernehmen</div>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => onSteps(steps ? steps + "\n• " + s : "• " + s)}
                  style={{
                    display: "flex", gap: 10, padding: "10px 14px",
                    background: `${color}06`, border: `1px solid ${color}20`,
                    borderRadius: 10, marginBottom: 6, cursor: "pointer",
                  }}
                >
                  <span style={{ color, fontWeight: 700, flexShrink: 0 }}>+</span>
                  <span style={{ fontSize: 13, color: "#555", lineHeight: 1.4 }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Square step ───────────────────────────────────────────────────────────────

function SquareStep({ data, steps1, onSteps1, steps2, onSteps2, sugg1, sugg2, loading1, loading2, onGetSugg1, onGetSugg2 }: {
  data: SquareData;
  steps1: string; onSteps1: (v: string) => void;
  steps2: string; onSteps2: (v: string) => void;
  sugg1: string[]; sugg2: string[];
  loading1: boolean; loading2: boolean;
  onGetSugg1: () => void; onGetSugg2: () => void;
}) {
  return wrap(<>
    <Label text="YOUR VALUEEQUADRAT" />
    <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 16px", lineHeight: 1.5 }}>
      Your value and its sister value — and what each becomes when taken too far.
    </p>

    <ValueSquareVisual data={data} />

    <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "16px 0 36px" }}>
      <DirectionCard nr={1} color={COLOR2} fromExcess={data.excessPrimary} towardValue={data.complementaryValue} description={data.direction1} />
      <DirectionCard nr={2} color={COLOR} fromExcess={data.excessComplementary} towardValue={data.primaryValue} description={data.direction2} />
    </div>

    <Label text="YOUR DEVELOPMENT" />

    <DevelopmentSection
      nr={1} color={COLOR2}
      fromExcess={data.excessPrimary} towardValue={data.complementaryValue} description={data.direction1}
      steps={steps1} onSteps={onSteps1}
      suggestions={sugg1} loading={loading1} onGetSuggestions={onGetSugg1}
    />
    <DevelopmentSection
      nr={2} color={COLOR}
      fromExcess={data.excessComplementary} towardValue={data.primaryValue} description={data.direction2}
      steps={steps2} onSteps={onSteps2}
      suggestions={sugg2} loading={loading2} onGetSuggestions={onGetSugg2}
    />
  </>);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ValueSquarePage() {
  const [step, setStep] = useState<Step>("enter");
  const [primaryValue, setPrimaryValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [squareData, setSquareData] = useState<SquareData | null>(null);
  const [steps1, setSteps1] = useState("");
  const [steps2, setSteps2] = useState("");
  const [sugg1, setSugg1] = useState<string[]>([]);
  const [sugg2, setSugg2] = useState<string[]>([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  async function handleEnter() {
    if (!primaryValue.trim()) return;
    setStep("analyzing");
    try {
      const res = await fetch("/api/games/value-square/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryValue }),
      });
      const data = await res.json();
      setSuggestions(data.values);
      setStep("pick");
    } catch {
      setStep("enter");
    }
  }

  async function handlePick(complementary: string) {
    setStep("building");
    try {
      const res = await fetch("/api/games/value-square/square", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryValue, complementaryValue: complementary }),
      });
      const data = await res.json();
      setSquareData({ primaryValue, complementaryValue: complementary, ...data });
      setStep("square");
    } catch {
      setStep("pick");
    }
  }

  async function getStepSuggestions(dir: 1 | 2) {
    if (!squareData) return;
    const setLoading = dir === 1 ? setLoading1 : setLoading2;
    const setSugg = dir === 1 ? setSugg1 : setSugg2;
    setLoading(true);
    try {
      const res = await fetch("/api/games/value-square/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squareData, direction: dir, existingSteps: dir === 1 ? steps1 : steps2 }),
      });
      const data = await res.json();
      setSugg(data.suggestions);
    } finally {
      setLoading(false);
    }
  }

  if (step === "enter") return <EnterStep value={primaryValue} onChange={setPrimaryValue} onContinue={handleEnter} />;
  if (step === "analyzing") return <LoadingStep text="Finding complementary values…" />;
  if (step === "pick") return <PickStep primaryValue={primaryValue} suggestions={suggestions} onPick={handlePick} />;
  if (step === "building") return <LoadingStep text="Building your value square…" />;
  if (step === "square" && squareData) return (
    <SquareStep
      data={squareData}
      steps1={steps1} onSteps1={setSteps1}
      steps2={steps2} onSteps2={setSteps2}
      sugg1={sugg1} sugg2={sugg2}
      loading1={loading1} loading2={loading2}
      onGetSugg1={() => getStepSuggestions(1)}
      onGetSugg2={() => getStepSuggestions(2)}
    />
  );
  return null;
}
