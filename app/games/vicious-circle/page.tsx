"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CircleData {
  s1: string; s2: string; f1: string; f2: string; r1: string; r2: string;
}

type SoloStep = "s1" | "s2" | "f2" | "f1" | "reflect";
type AppMode  = "choose" | "solo" | "pair-setup" | "pair-fill" | "pair-waiting" | "pair-result";

// ── Colors & helpers ──────────────────────────────────────────────────────────

const PINK   = "#d4537e";
const ORANGE = "#e07a3a";
const FONT   = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function inputSt(rows?: number): React.CSSProperties {
  return {
    width: "100%", fontSize: 14, padding: "12px 16px",
    border: "1.5px solid #e0e0e0", borderRadius: 12, outline: "none",
    boxSizing: "border-box", color: "#111", fontFamily: FONT, background: "#fff",
    resize: rows ? "none" : undefined, lineHeight: 1.6,
  };
}
function btnSt(color: string, outlined?: boolean, disabled?: boolean): React.CSSProperties {
  return {
    padding: "12px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: FONT, border: outlined ? `1.5px solid ${color}50` : "none",
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
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>The Vicious Circle</span>
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

// ── Circle Visual (SVG) ───────────────────────────────────────────────────────

function CircleVisual({ name1, name2, data, active, step }: {
  name1: string; name2: string;
  data: Partial<CircleData>;
  active?: "s1" | "s2" | "f1" | "f2";
  step?: SoloStep;
}) {
  // Progressive reveal: which nodes are visible
  const stepOrder: SoloStep[] = ["s1", "s2", "f2", "f1", "reflect"];
  const idx = step ? stepOrder.indexOf(step) : 4;
  const show = { s1: idx >= 0, s2: idx >= 1, f2: idx >= 2, f1: idx >= 3 };

  // Arrows visible only when both connected nodes are shown
  const arrTopRight  = show.s1 && show.f2;  // TOP → RIGHT
  const arrRightBot  = show.f2 && show.s2;  // RIGHT → BOTTOM
  const arrBotLeft   = show.s2 && show.f1;  // BOTTOM → LEFT
  const arrLeftTop   = show.f1 && show.s1;  // LEFT → TOP

  const DARK = "#555";
  const stmtFill  = (k: "s1"|"s2") => data[k] ? `${PINK}14`   : active === k ? `${PINK}08`   : "#f9f9f9";
  const feelFill  = (k: "f1"|"f2") => data[k] ? `${ORANGE}14` : active === k ? `${ORANGE}08` : "#f9f9f9";
  const stmtStroke= (k: "s1"|"s2") => active===k ? PINK   : data[k] ? `${PINK}60`   : "#e0e0e0";
  const feelStroke= (k: "f1"|"f2") => active===k ? ORANGE : data[k] ? `${ORANGE}60` : "#e0e0e0";
  const stmtSW    = (k: "s1"|"s2") => active===k ? 2 : 1.5;
  const feelSW    = (k: "f1"|"f2") => active===k ? 2 : 1.5;
  const trunc = (s: string | undefined, n = 22) => s ? (s.length > n ? s.slice(0, n) + "…" : s) : "";

  return (
    <svg viewBox="0 0 400 340" style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }}>
      <defs>
        <marker id="vc-arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 Z" fill={DARK} />
        </marker>
      </defs>

      {/* Arrows — clockwise, only when both nodes visible */}
      {arrTopRight && <>
        <path d="M 280,50 Q 365,50 365,118" fill="none" stroke={DARK} strokeWidth="1.5" markerEnd="url(#vc-arr)" />
        <text x="358" y="77"  fontSize="8.5" fill={DARK} textAnchor="middle">feels because</text>
        <text x="358" y="88"  fontSize="8.5" fill={DARK} textAnchor="middle">of it →</text>
      </>}
      {arrRightBot && <>
        <path d="M 365,222 Q 365,292 280,292" fill="none" stroke={DARK} strokeWidth="1.5" markerEnd="url(#vc-arr)" />
        <text x="358" y="259" fontSize="8.5" fill={DARK} textAnchor="middle">acts</text>
        <text x="358" y="270" fontSize="8.5" fill={DARK} textAnchor="middle">accordingly →</text>
      </>}
      {arrBotLeft && <>
        <path d="M 120,292 Q 35,292 35,222" fill="none" stroke={DARK} strokeWidth="1.5" markerEnd="url(#vc-arr)" />
        <text x="42" y="259" fontSize="8.5" fill={DARK} textAnchor="middle">← feels because</text>
        <text x="42" y="270" fontSize="8.5" fill={DARK} textAnchor="middle">of it</text>
      </>}
      {arrLeftTop && <>
        <path d="M 35,118 Q 35,50 120,50" fill="none" stroke={DARK} strokeWidth="1.5" markerEnd="url(#vc-arr)" />
        <text x="42" y="77"  fontSize="8.5" fill={DARK} textAnchor="middle">← acts</text>
        <text x="42" y="88"  fontSize="8.5" fill={DARK} textAnchor="middle">accordingly</text>
      </>}

      {/* TOP box — Statement Person 1 */}
      {show.s1 && <>
        <rect x="120" y="10" width="160" height="80" rx="10"
          fill={stmtFill("s1")} stroke={stmtStroke("s1")} strokeWidth={stmtSW("s1")} />
        <text x="200" y="36" textAnchor="middle" fontSize="8" fontWeight="700" fill={PINK} letterSpacing="0.06em">STATEMENT / BEHAVIOR</text>
        <text x="200" y="50" textAnchor="middle" fontSize="10" fontWeight="700" fill={PINK}>{name1}</text>
        {data.s1
          ? <text x="200" y="73" textAnchor="middle" fontSize="10" fill="#555">{trunc(data.s1)}</text>
          : active === "s1" && <text x="200" y="73" textAnchor="middle" fontSize="9" fill="#bbb">enter below…</text>}
      </>}

      {/* RIGHT oval — Feeling Person 2 */}
      {show.f2 && <>
        <ellipse cx="365" cy="170" rx="55" ry="52"
          fill={feelFill("f2")} stroke={feelStroke("f2")} strokeWidth={feelSW("f2")} />
        <text x="365" y="160" textAnchor="middle" fontSize="8" fontWeight="700" fill={ORANGE} letterSpacing="0.05em">INNER FEELING</text>
        <text x="365" y="174" textAnchor="middle" fontSize="10" fontWeight="700" fill={ORANGE}>{name2}</text>
        {data.f2
          ? <text x="365" y="191" textAnchor="middle" fontSize="10" fill="#555">{trunc(data.f2, 10)}</text>
          : active === "f2" && <text x="365" y="190" textAnchor="middle" fontSize="9" fill="#bbb">enter…</text>}
      </>}

      {/* BOTTOM box — Statement Person 2 */}
      {show.s2 && <>
        <rect x="120" y="250" width="160" height="80" rx="10"
          fill={stmtFill("s2")} stroke={stmtStroke("s2")} strokeWidth={stmtSW("s2")} />
        <text x="200" y="275" textAnchor="middle" fontSize="8" fontWeight="700" fill={PINK} letterSpacing="0.06em">STATEMENT / BEHAVIOR</text>
        <text x="200" y="289" textAnchor="middle" fontSize="10" fontWeight="700" fill={PINK}>{name2}</text>
        {data.s2
          ? <text x="200" y="312" textAnchor="middle" fontSize="10" fill="#555">{trunc(data.s2)}</text>
          : active === "s2" && <text x="200" y="312" textAnchor="middle" fontSize="9" fill="#bbb">enter below…</text>}
      </>}

      {/* LEFT oval — Feeling Person 1 */}
      {show.f1 && <>
        <ellipse cx="35" cy="170" rx="55" ry="52"
          fill={feelFill("f1")} stroke={feelStroke("f1")} strokeWidth={feelSW("f1")} />
        <text x="35" y="160" textAnchor="middle" fontSize="8" fontWeight="700" fill={ORANGE} letterSpacing="0.05em">INNER FEELING</text>
        <text x="35" y="174" textAnchor="middle" fontSize="10" fontWeight="700" fill={ORANGE}>{name1}</text>
        {data.f1
          ? <text x="35" y="191" textAnchor="middle" fontSize="10" fill="#555">{trunc(data.f1, 10)}</text>
          : active === "f1" && <text x="35" y="190" textAnchor="middle" fontSize="9" fill="#bbb">enter…</text>}
      </>}
    </svg>
  );
}

// ── Reflection section ────────────────────────────────────────────────────────

function ReflectionSection({ name1, name2, circle, r1, setR1, r2, setR2 }: {
  name1: string; name2: string; circle: CircleData;
  r1: string; setR1: (v: string) => void;
  r2: string; setR2: (v: string) => void;
}) {
  const [sugg1, setSugg1] = useState<string[]>([]);
  const [sugg2, setSugg2] = useState<string[]>([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  async function getSuggestions(type: "escalate" | "break") {
    const setLoading = type === "escalate" ? setLoading1 : setLoading2;
    const setSugg   = type === "escalate" ? setSugg1    : setSugg2;
    setLoading(true);
    try {
      const res = await fetch("/api/games/vicious-circle/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name1, name2, ...circle, type }),
      });
      const data = await res.json();
      setSugg(data.suggestions);
    } finally { setLoading(false); }
  }

  const SuggList = ({ items, color }: { items: string[]; color: string }) => (
    <div style={{ marginTop: 10 }}>
      {items.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 8, padding: "8px 12px", background: `${color}06`, border: `1px solid ${color}20`, borderRadius: 8, marginBottom: 6 }}>
          <span style={{ color, fontWeight: 700 }}>→</span>
          <span style={{ fontSize: 13, color: "#555", lineHeight: 1.4 }}>{s}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ marginTop: 32 }}>
      <Label text="REFLECTION" />

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#333", margin: "0 0 8px" }}>How did this cycle escalate over time?</p>
        <textarea value={r1} onChange={e => setR1(e.target.value)} rows={3}
          placeholder="What makes this cycle self-reinforcing…"
          style={{ ...inputSt(3), marginBottom: 8 }} />
        <button onClick={() => getSuggestions("escalate")} disabled={loading1}
          style={{ ...btnSt(PINK, true, loading1) }}>
          {loading1 ? "Loading…" : "Get insights →"}
        </button>
        {sugg1.length > 0 && <SuggList items={sugg1} color={PINK} />}
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#333", margin: "0 0 8px" }}>How could this cycle be broken?</p>
        <textarea value={r2} onChange={e => setR2(e.target.value)} rows={3}
          placeholder="What could either person do differently…"
          style={{ ...inputSt(3), marginBottom: 8 }} />
        <button onClick={() => getSuggestions("break")} disabled={loading2}
          style={{ ...btnSt(ORANGE, true, loading2) }}>
          {loading2 ? "Loading…" : "Get suggestions →"}
        </button>
        {sugg2.length > 0 && <SuggList items={sugg2} color={ORANGE} />}
      </div>
    </div>
  );
}

// ── Step input card ───────────────────────────────────────────────────────────

function StepCard({ label, prompt, value, onChange, onNext, nextLabel, placeholder, rows }: {
  label: string; prompt: string; value: string;
  onChange: (v: string) => void; onNext: () => void; nextLabel: string;
  placeholder: string; rows?: number;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "20px 20px 16px" }}>
      <Label text={label} />
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 12px", lineHeight: 1.5 }}>{prompt}</p>
      {rows
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} autoFocus style={{ ...inputSt(rows) }} />
        : <input value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && value.trim()) onNext(); }} placeholder={placeholder} autoFocus style={{ ...inputSt() }} />
      }
      <button onClick={onNext} disabled={!value.trim()} style={{ ...btnSt(PINK, false, !value.trim()), marginTop: 12, width: "100%" }}>
        {nextLabel}
      </button>
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────

function Spinner({ text }: { text: string }) {
  return wrap(
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${PINK}30`, borderTopColor: PINK, borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize: 15, color: "#888" }}>{text}</p>
    </div>
  );
}

// ── Pair result — combined third schema ───────────────────────────────────────

function ThirdSchema({ name1, name2, c1, c2 }: { name1: string; name2: string; c1: Partial<CircleData>; c2: Partial<CircleData> }) {
  // Combined: s1 from c1, f2 from c2 (P2's actual feeling), s2 from c2, f1 from c1 (P1's actual feeling)
  const combined: Partial<CircleData> = {
    s1: c1.s1, f2: c2.f1, // P2's OWN feeling
    s2: c2.s1, f1: c1.f1, // P1's OWN feeling — c2.s1 is P2's view of their own behavior = P1's bottom
  };
  return (
    <div style={{ marginTop: 32 }}>
      <Label text="COMBINED PICTURE" />
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 16px", lineHeight: 1.5 }}>
        This diagram combines both perspectives — with each person's <em>actual</em> inner feeling.
      </p>
      <CircleVisual name1={name1} name2={name2} data={combined} />
    </div>
  );
}

function PairResultStep({ name1, name2, c1, c2 }: { name1: string; name2: string; c1: Partial<CircleData>; c2: Partial<CircleData> }) {
  const [showThird, setShowThird] = useState(false);
  return wrap(<>
    <Label text="BOTH CIRCLES" />
    <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 20px", lineHeight: 1.5 }}>
      Here are your two perspectives side by side. Discuss: what did the other really feel — and why did they react that way?
    </p>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: "0.07em", margin: "0 0 8px" }}>{name1.toUpperCase()}'S VIEW</p>
        <CircleVisual name1={name1} name2={name2} data={c1} />
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: PINK, letterSpacing: "0.07em", margin: "0 0 8px" }}>{name2.toUpperCase()}'S VIEW</p>
        <CircleVisual name1={name1} name2={name2} data={{ s1: c2.s2, s2: c2.s1, f1: c2.f2, f2: c2.f1 }} />
      </div>
    </div>

    <div style={{ background: "#fff9f5", border: `1.5px solid ${ORANGE}30`, borderRadius: 12, padding: "16px 18px", margin: "20px 0" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: ORANGE, margin: "0 0 6px" }}>Discussion prompts</p>
      <ul style={{ fontSize: 13, color: "#666", lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
        <li>What surprised you about the other person's circle?</li>
        <li>Where did your assumptions about the other's feelings differ from reality?</li>
        <li>What could each of you do differently to break the cycle?</li>
      </ul>
    </div>

    <button onClick={() => setShowThird(v => !v)} style={{ ...btnSt("#111", true), width: "100%", marginBottom: 8 }}>
      {showThird ? "Hide combined picture ↑" : "Show combined picture ↓"}
    </button>

    {showThird && <ThirdSchema name1={name1} name2={name2} c1={c1} c2={c2} />}
  </>);
}

// ── Main inner component (uses searchParams) ──────────────────────────────────

function ViciousCircleInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL pair params
  const urlSession = searchParams.get("s");
  const urlPlayer  = searchParams.get("p") === "2" ? 2 : 1;
  const urlN1      = searchParams.get("n1") ?? "You";
  const urlN2      = searchParams.get("n2") ?? "Other person";

  // Mode & flow state
  const [mode, setMode]       = useState<AppMode>(urlSession ? "pair-fill" : "choose");
  const [soloStep, setSoloStep] = useState<SoloStep>("s1");

  // Names
  const [name1, setName1] = useState(urlSession ? (urlPlayer === 1 ? urlN1 : urlN2) : "You");
  const [name2, setName2] = useState(urlSession ? (urlPlayer === 1 ? urlN2 : urlN1) : "Other person");
  const [pairN1, setPairN1] = useState("");
  const [pairN2, setPairN2] = useState("");

  // Circle data
  const [data, setData] = useState<Partial<CircleData>>({});
  const set = (k: keyof CircleData) => (v: string) => setData(d => ({ ...d, [k]: v }));
  const [r1, setR1] = useState("");
  const [r2, setR2] = useState("");

  // Pair session state
  const [sessionId, setSessionId] = useState(urlSession ?? "");
  const [player,    setPlayer]    = useState<1|2>(urlPlayer);
  const [peerDone,  setPeerDone]  = useState(false);
  const [peerCircle, setPeerCircle] = useState<Partial<CircleData> | null>(null);

  // Poll for pair partner
  const poll = useCallback(async () => {
    if (!sessionId || mode !== "pair-waiting") return;
    try {
      const res = await fetch(`/api/games/vicious-circle/session?id=${sessionId}`);
      const s = await res.json();
      if (player === 1 && s.done2) { setPeerCircle(s.circle2); setPeerDone(true); setMode("pair-result"); }
      if (player === 2 && s.done1) { setPeerCircle(s.circle1); setPeerDone(true); setMode("pair-result"); }
    } catch { /* ignore */ }
  }, [sessionId, mode, player]);

  useEffect(() => {
    if (mode !== "pair-waiting") return;
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [mode, poll]);

  // Pair fill: names depend on player
  const myName    = player === 1 ? name1 : name2;
  const otherName = player === 1 ? name2 : name1;

  // ── Pair setup ──
  async function startPairSession() {
    const n1 = pairN1.trim() || "Person 1";
    const n2 = pairN2.trim() || "Person 2";
    setName1(n1); setName2(n2);
    const res = await fetch("/api/games/vicious-circle/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name1: n1, name2: n2 }),
    });
    const s = await res.json();
    setSessionId(s.id);
    setPlayer(1);
    setMode("pair-fill");
    setSoloStep("s1");
  }

  // ── Submit circle (pair) ──
  async function submitPairCircle() {
    await fetch("/api/games/vicious-circle/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", id: sessionId, player, data: { ...data, r1, r2 } }),
    });
    setMode("pair-waiting");
  }

  // ── Step navigation ──
  function nextSoloStep() {
    const order: SoloStep[] = ["s1", "s2", "f2", "f1", "reflect"];
    const idx = order.indexOf(soloStep);
    if (idx < order.length - 1) setSoloStep(order[idx + 1]);
  }

  const pairFillOrder: SoloStep[] = ["s1", "s2", "f2", "f1", "reflect"];

  // ── Render ──

  if (mode === "choose") return wrap(<>
    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>The Vicious Circle</h1>
    <p style={{ fontSize: 15, color: "#888", margin: "0 0 36px", lineHeight: 1.6 }}>
      Map the self-reinforcing loop that keeps two people stuck — and find a way out.
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button onClick={() => { setMode("solo"); setSoloStep("s1"); }}
        style={{ ...btnSt(PINK), fontSize: 15, padding: "18px 24px", textAlign: "left" }}>
        🔍 Explore alone
        <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.8, marginTop: 4 }}>
          Map the circle from your perspective
        </span>
      </button>
      <button onClick={() => setMode("pair-setup")}
        style={{ ...btnSt(ORANGE), fontSize: 15, padding: "18px 24px", textAlign: "left" }}>
        👥 Explore with a partner
        <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.8, marginTop: 4 }}>
          Both map their view — then compare and find the real picture
        </span>
      </button>
    </div>
  </>);

  // ── Solo flow ──
  if (mode === "solo") {
    const step = soloStep;
    const fullCircle = data.s1 && data.s2 && data.f1 && data.f2;

    return wrap(<>
      <CircleVisual name1="You" name2="Other person" data={data} step={step}
        active={step !== "reflect" ? step as "s1"|"s2"|"f1"|"f2" : undefined} />
      <div style={{ marginTop: 20 }}>
        {step === "s1" && <StepCard label="STEP 1 OF 4" prompt="What do you say or do that starts (or continues) the cycle?" value={data.s1 ?? ""} onChange={set("s1")} onNext={nextSoloStep} nextLabel="Continue →" placeholder="e.g. I withdraw and go silent…" />}
        {step === "s2" && <StepCard label="STEP 2 OF 4" prompt="How does the other person react — what do they say or do?" value={data.s2 ?? ""} onChange={set("s2")} onNext={nextSoloStep} nextLabel="Continue →" placeholder="e.g. They push harder for a response…" />}
        {step === "f2" && <StepCard label="STEP 3 OF 4" prompt={`What must the other person have felt — to react that way?`} value={data.f2 ?? ""} onChange={set("f2")} onNext={nextSoloStep} nextLabel="Continue →" placeholder="e.g. Ignored, anxious, not valued…" />}
        {step === "f1" && <StepCard label="STEP 4 OF 4" prompt="And what do YOU feel — that makes you respond with your behavior in step 1?" value={data.f1 ?? ""} onChange={set("f1")} onNext={nextSoloStep} nextLabel="See your circle →" placeholder="e.g. Overwhelmed, pressured, suffocated…" />}
        {step === "reflect" && fullCircle && (
          <ReflectionSection name1="You" name2="Other person" circle={data as CircleData} r1={r1} setR1={setR1} r2={r2} setR2={setR2} />
        )}
        {step === "reflect" && (
          <div style={{ borderTop: "1px solid #eee", paddingTop: 24, marginTop: 24 }}>
            <button onClick={() => { setData({}); setSoloStep("s1"); setR1(""); setR2(""); }} style={{ ...btnSt("#111", true), width: "100%" }}>
              ↩ Start over
            </button>
          </div>
        )}
      </div>
    </>);
  }

  // ── Pair setup ──
  if (mode === "pair-setup") return wrap(<>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>Explore with a partner</h2>
    <p style={{ fontSize: 14, color: "#888", margin: "0 0 28px", lineHeight: 1.5 }}>
      Enter both names, then share the link with your partner. Each of you maps the circle independently — then you compare.
    </p>
    <Label text="YOUR NAME" />
    <input value={pairN1} onChange={e => setPairN1(e.target.value)} placeholder="Your name…" style={{ ...inputSt(), marginBottom: 14 }} />
    <Label text="PARTNER'S NAME" />
    <input value={pairN2} onChange={e => setPairN2(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && pairN1.trim() && pairN2.trim()) startPairSession(); }} placeholder="Partner's name…" style={{ ...inputSt(), marginBottom: 18 }} />
    <button onClick={startPairSession} disabled={!pairN1.trim() || !pairN2.trim()}
      style={{ ...btnSt(PINK, false, !pairN1.trim() || !pairN2.trim()), width: "100%" }}>
      Create session & get link →
    </button>
  </>);

  // ── Pair fill ──
  if (mode === "pair-fill") {
    const step = soloStep;
    const filledAll = data.s1 && data.s2 && data.f1 && data.f2;
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/games/vicious-circle?s=${sessionId}&p=2&n1=${encodeURIComponent(name1)}&n2=${encodeURIComponent(name2)}`
      : "";

    return wrap(<>
      {player === 1 && step === "s1" && (
        <div style={{ background: `${ORANGE}10`, border: `1.5px solid ${ORANGE}30`, borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: ORANGE, margin: "0 0 6px", letterSpacing: "0.06em" }}>SHARE WITH {name2.toUpperCase()}</p>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 10px" }}>Send this link to your partner. You can both fill in simultaneously.</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input readOnly value={shareUrl} style={{ ...inputSt(), fontSize: 11, flex: 1 }} />
            <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{ ...btnSt(ORANGE, true), whiteSpace: "nowrap", fontSize: 12 }}>
              Copy →
            </button>
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, fontWeight: 600, color: PINK, margin: "0 0 4px" }}>Filling in as: <strong>{myName}</strong></p>
      <CircleVisual name1={name1} name2={name2} step={step} data={
        player === 1 ? data : { s1: data.s2, s2: data.s1, f1: data.f2, f2: data.f1 }
      } active={step !== "reflect" ? step as "s1"|"s2"|"f1"|"f2" : undefined} />

      <div style={{ marginTop: 20 }}>
        {step === "s1" && <StepCard label="STEP 1 OF 4" prompt={`What do you (${myName}) say or do?`} value={data.s1 ?? ""} onChange={set("s1")} onNext={nextSoloStep} nextLabel="Continue →" placeholder="e.g. I withdraw and go silent…" />}
        {step === "s2" && <StepCard label="STEP 2 OF 4" prompt={`How does ${otherName} react?`} value={data.s2 ?? ""} onChange={set("s2")} onNext={nextSoloStep} nextLabel="Continue →" placeholder="e.g. They push harder…" />}
        {step === "f2" && <StepCard label="STEP 3 OF 4" prompt={`What must ${otherName} have felt — to react that way?`} value={data.f2 ?? ""} onChange={set("f2")} onNext={nextSoloStep} nextLabel="Continue →" placeholder="e.g. Ignored, anxious…" />}
        {step === "f1" && <StepCard label="STEP 4 OF 4" prompt={`What do YOU (${myName}) feel — that leads to your behavior in step 1?`} value={data.f1 ?? ""} onChange={set("f1")} onNext={() => setSoloStep("reflect")} nextLabel="See my circle →" placeholder="e.g. Overwhelmed, pressured…" />}
        {step === "reflect" && filledAll && (
          <>
            <ReflectionSection name1={myName} name2={otherName} circle={data as CircleData} r1={r1} setR1={setR1} r2={r2} setR2={setR2} />
            <div style={{ marginTop: 24 }}>
              <button onClick={submitPairCircle} style={{ ...btnSt(PINK), width: "100%" }}>
                Submit my circle — wait for {otherName} →
              </button>
            </div>
          </>
        )}
      </div>
    </>);
  }

  // ── Pair waiting ──
  if (mode === "pair-waiting") return <Spinner text={`Waiting for your partner to finish their circle…`} />;

  // ── Pair result ──
  if (mode === "pair-result" && peerCircle) {
    const myCircle   = data;
    const peerCircleData = peerCircle;
    const c1 = player === 1 ? myCircle   : peerCircleData;
    const c2 = player === 1 ? peerCircleData : myCircle;
    return <PairResultStep name1={name1} name2={name2} c1={c1} c2={c2} />;
  }

  return null;
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────

export default function ViciousCirclePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f7f7f5" }} />}>
      <ViciousCircleInner />
    </Suspense>
  );
}
