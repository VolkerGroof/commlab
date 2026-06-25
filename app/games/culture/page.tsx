"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { CultureSession, CultureAgreement } from "@/lib/cultureStore";

// ── 8 Dimensions ──────────────────────────────────────────────────────────────

const DIMENSIONS = [
  {
    name: "Communicating",
    icon: "💬",
    leftLabel: "Explicit & direct",
    rightLabel: "Implicit & contextual",
    color: "#7c6fcd",
    questions: [
      "When I disagree with a decision, I...",
      "I expect instructions and feedback to be...",
      "In our team, important things should be...",
    ],
    options: [
      ["Say it directly", "Mostly say it", "Usually say it", "Hint at it", "Imply it", "Leave it unsaid"],
      ["Step-by-step detailed", "Fairly detailed", "Balanced", "High-level", "Brief", "Minimal — figure it out"],
      ["Stated explicitly in writing", "Said clearly", "Communicated clearly", "Implied", "Read between lines", "Understood without saying"],
    ],
    scaleLabels: ["Very explicit", "Mostly explicit", "Balanced", "Context-dependent", "Often implicit", "Highly implicit"],
    problems: [
      "High scorers may feel low scorers are blunt or rude",
      "Low scorers may feel high scorers are vague or indirect",
      "Misaligned expectations on what needs to be written vs. said",
    ],
  },
  {
    name: "Feedback",
    icon: "🔍",
    leftLabel: "Very direct",
    rightLabel: "Diplomatic / indirect",
    color: "#e07a3a",
    questions: [
      "When giving negative feedback, I prefer to...",
      "I prefer to receive critical feedback...",
      "'Brutal honesty' is...",
    ],
    options: [
      ["Say it immediately and directly", "Be fairly direct", "Balance positive/negative", "Soften it a bit", "Wrap in many positives", "Never directly"],
      ["Bluntly and clearly", "Directly but kindly", "With some context", "Softened", "Wrapped in positives", "Very diplomatically"],
      ["Essential and valued", "Useful", "Sometimes helpful", "Often too harsh", "Usually inappropriate", "Never acceptable"],
    ],
    scaleLabels: ["Very direct", "Direct", "Balanced", "Diplomatic", "Indirect", "Very indirect"],
    problems: [
      "Direct people may be seen as harsh or unkind",
      "Diplomatic people may be seen as evasive or dishonest",
      "Feedback may not land — too harsh or too vague",
    ],
  },
  {
    name: "Deciding",
    icon: "⚖️",
    leftLabel: "Top-down, fast",
    rightLabel: "Full consensus",
    color: "#378add",
    questions: [
      "Best decisions are made by...",
      "Speed vs. buy-in: I prefer...",
      "Can decisions be revisited after they're made?",
    ],
    options: [
      ["The leader alone", "Leader with input", "Small group", "Team vote", "Wide consensus", "Full team consensus"],
      ["Fast, even if imperfect", "Mostly fast", "Balance both", "Some buy-in needed", "Strong buy-in needed", "Full buy-in always"],
      ["Rarely — decide and commit", "Only if major new info", "Sometimes", "Often OK", "Usually yes", "Always revisable"],
    ],
    scaleLabels: ["Top-down", "Leader-led", "Consultative", "Team-driven", "Consensus-seeking", "Full consensus"],
    problems: [
      "Fast deciders may make others feel unheard",
      "Consensus seekers may slow things down or frustrate action-oriented colleagues",
      "Misaligned on whether decisions are 'final'",
    ],
  },
  {
    name: "Trusting",
    icon: "🤝",
    leftLabel: "Task-based (results)",
    rightLabel: "Relationship-based (connection)",
    color: "#1d9e75",
    questions: [
      "I trust a colleague mainly when...",
      "To work well together, you first need to...",
      "Team dinners and social time are...",
    ],
    options: [
      ["They deliver results reliably", "They do good work", "Both work & personality", "I know them somewhat", "I know them well", "We have a real personal bond"],
      ["Just work together on tasks", "Have some shared work", "A mix", "Get to know each other", "Know each other personally", "Have a real personal relationship"],
      ["Nice-to-have", "Occasionally useful", "Somewhat valuable", "Valuable for cohesion", "Very important", "Essential for trust"],
    ],
    scaleLabels: ["Task-based", "Mostly task", "Balanced", "Some relationship", "Relationship-focused", "Deep relationship"],
    problems: [
      "Task-based people may feel relationship-based people are wasting time",
      "Relationship-based people may feel task-based people are cold or distant",
      "Trust doesn't build the same way for everyone",
    ],
  },
  {
    name: "Disagreeing",
    icon: "⚡",
    leftLabel: "Avoids conflict",
    rightLabel: "Embraces open debate",
    color: "#d4537e",
    questions: [
      "In a meeting, when I disagree with an idea, I...",
      "Disagreement in a team is...",
      "After a heated debate, I feel...",
    ],
    options: [
      ["Stay quiet", "Mention it privately after", "Sometimes speak up", "Mostly speak up", "Always speak up", "Challenge it directly in the moment"],
      ["Something to minimize", "Uncomfortable but necessary", "Normal", "Healthy", "Very valuable", "Essential for good outcomes"],
      ["Uncomfortable — it affects the relationship", "A bit uncomfortable", "Neutral", "Fine — it's just work", "Good — we cleared the air", "Energized — that's how we improve"],
    ],
    scaleLabels: ["Avoids conflict", "Dislikes conflict", "Cautious", "Accepts conflict", "Welcomes debate", "Thrives on debate"],
    problems: [
      "Debate-lovers may be seen as aggressive or combative",
      "Conflict-avoiders may be seen as passive or disengaged",
      "Important issues may not surface if some people stay silent",
    ],
  },
  {
    name: "Meetings",
    icon: "📅",
    leftLabel: "Information sharing",
    rightLabel: "Decision making",
    color: "#639922",
    questions: [
      "Meetings are primarily for...",
      "A meeting without a clear outcome is...",
      "Pre-reading and preparation before meetings is...",
    ],
    options: [
      ["Sharing status updates", "Mostly reporting", "Balanced", "Mostly discussing", "Making decisions", "Creative problem-solving together"],
      ["Normal and fine", "Sometimes OK", "Acceptable occasionally", "Suboptimal", "Usually a waste", "Always a waste"],
      ["Optional — discuss in the room", "Nice to have", "Helpful", "Important", "Very important", "Always required"],
    ],
    scaleLabels: ["Info sharing", "Mostly reporting", "Mixed", "Discussion-focused", "Decision-focused", "Co-creation"],
    problems: [
      "Misaligned expectations on what outcomes meetings should produce",
      "People show up with different levels of preparation",
      "Some feel meetings are wasted time; others see them as essential",
    ],
  },
  {
    name: "Time & Structure",
    icon: "⏰",
    leftLabel: "Flexible / loose",
    rightLabel: "Structured / punctual",
    color: "#e67e22",
    questions: [
      "Meetings should start...",
      "Deadlines in a project are...",
      "Detailed plans and timelines are...",
    ],
    options: [
      ["Whenever people arrive", "A few minutes late is fine", "Roughly on time", "Mostly on time", "On time", "Exactly on time — always"],
      ["Approximate targets", "Mostly flexible", "Important but adjustable", "Firm unless renegotiated", "Non-negotiable", "Sacred — never miss them"],
      ["Overly rigid — things change", "Helpful sometimes", "Useful as a guide", "Important", "Very important", "Essential and must be followed"],
    ],
    scaleLabels: ["Very flexible", "Mostly flexible", "Balanced", "Structured", "Very structured", "Strictly punctual"],
    problems: [
      "Structured people are frustrated by loose timekeeping",
      "Flexible people feel over-controlled by rigid structure",
      "Deadlines are taken differently — causing misaligned expectations",
    ],
  },
  {
    name: "Authority",
    icon: "👑",
    leftLabel: "Egalitarian",
    rightLabel: "Hierarchical",
    color: "#8e44ad",
    questions: [
      "The ideal leader is...",
      "Junior team members should...",
      "Seniority and title in decisions matter...",
    ],
    options: [
      ["A coach — first among equals", "Mostly collaborative", "Balanced", "Directive when needed", "Mostly directive", "Clear authority figure"],
      ["Freely challenge any decision", "Mostly speak freely", "Use judgment", "Show some deference", "Mostly defer", "Always show deference"],
      ["Not at all — ideas win", "Very little", "Somewhat", "Noticeably", "Significantly", "Completely — seniority decides"],
    ],
    scaleLabels: ["Fully egalitarian", "Mostly flat", "Balanced", "Some hierarchy", "Hierarchical", "Strongly hierarchical"],
    problems: [
      "Egalitarian people feel frustrated when hierarchy blocks ideas",
      "Hierarchy-oriented people may feel disrespected when junior members push back",
      "Unclear who has final say in decisions",
    ],
  },
] as const;

// ── Constants ─────────────────────────────────────────────────────────────────

const COLOR = "#5c6bc0";
const FONT  = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function inputSt(): React.CSSProperties {
  return { width:"100%", fontSize:14, padding:"12px 16px", border:"1.5px solid #e0e0e0", borderRadius:12, outline:"none", boxSizing:"border-box", color:"#111", fontFamily:FONT, background:"#fff" };
}
function wrap(content: React.ReactNode) {
  return (
    <div style={{ minHeight:"100vh", background:"#f7f7f5", fontFamily:FONT }}>
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:10, background:"#fff", borderBottom:"1px solid #eee", padding:"0 28px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link href="/" style={{ fontSize:13, color:"#999", textDecoration:"none" }}>← CommLab</Link>
        <span style={{ fontSize:14, fontWeight:600, color:"#111" }}>Everyone Culture</span>
        <span />
      </div>
      <div style={{ paddingTop:52 }}>
        <div style={{ maxWidth:640, margin:"0 auto", padding:"48px 24px 80px" }}>
          {content}
        </div>
      </div>
    </div>
  );
}

// ── Score Scale Visual ────────────────────────────────────────────────────────

function ScaleVisual({ scores, dim, color }: {
  scores: Record<string, number>; dim: typeof DIMENSIONS[number]; color: string;
}) {
  const positions: Record<number, string[]> = {};
  Object.entries(scores).forEach(([name, score]) => {
    if (!positions[score]) positions[score] = [];
    positions[score].push(name);
  });

  return (
    <div style={{ margin:"20px 0" }}>
      <div style={{ position:"relative", height:40, marginBottom:6 }}>
        {[1,2,3,4,5,6].map(n => (
          <div key={n} style={{ position:"absolute", left:`${(n-1)*20}%`, width:"20%", display:"flex", flexDirection:"column", alignItems:"center" }}>
            {positions[n]?.map(name => (
              <span key={name} style={{ fontSize:11, fontWeight:700, background:color, color:"#fff", borderRadius:10, padding:"2px 7px", marginBottom:2, whiteSpace:"nowrap" }}>
                {name}
              </span>
            ))}
          </div>
        ))}
      </div>
      {/* Scale bar */}
      <div style={{ display:"flex", borderRadius:8, overflow:"hidden", height:12, background:`linear-gradient(to right, ${color}40, ${color})` }}>
        {[1,2,3,4,5,6].map(n => (
          <div key={n} style={{ flex:1, borderRight: n<6 ? "1px solid rgba(255,255,255,0.4)" : "none" }} />
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
        <span style={{ fontSize:11, color:"#888", fontWeight:600 }}>1 — {dim.leftLabel}</span>
        <span style={{ fontSize:11, color:"#888", fontWeight:600 }}>{dim.rightLabel} — 6</span>
      </div>
      {/* Legend */}
      <div style={{ marginTop:14, display:"flex", flexWrap:"wrap", gap:6 }}>
        {dim.scaleLabels.map((label, i) => (
          <span key={i} style={{ fontSize:11, background:"#f0f0f0", borderRadius:6, padding:"3px 8px", color:"#666" }}>
            <strong>{i+1}</strong> — {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Agreement Card ────────────────────────────────────────────────────────────

function AgreementCard({ ag, myName, participants, onApprove, onEdit }: {
  ag: CultureAgreement; myName: string; participants: string[];
  onApprove: () => void; onEdit: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(ag.text);
  const iApproved = ag.approvals.includes(myName);
  const allApproved = participants.every(p => ag.approvals.includes(p));

  return (
    <div style={{ background:"#fff", borderRadius:12, border:`1.5px solid ${allApproved ? "#1d9e75" : "#eee"}`, padding:"14px 16px", marginBottom:10 }}>
      {editing ? (
        <>
          <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
            style={{ ...inputSt(), resize:"none", fontSize:13, marginBottom:8 }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { onEdit(editText); setEditing(false); }} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:COLOR, color:"#fff", fontFamily:FONT }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"1.5px solid #ddd", background:"#fff", color:"#888", fontFamily:FONT }}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize:14, color:"#444", margin:"0 0 10px", lineHeight:1.5 }}>{ag.text}</p>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={() => setEditing(true)} style={{ padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", border:"1.5px solid #e0e0e0", background:"#fafafa", color:"#888", fontFamily:FONT }}>
              ✏️ Edit
            </button>
            <button onClick={onApprove} disabled={iApproved} style={{ padding:"5px 14px", borderRadius:8, fontSize:11, fontWeight:600, cursor:iApproved ? "default" : "pointer", border:`1.5px solid ${iApproved ? "#1d9e75" : "#e0e0e0"}`, background:iApproved ? "#1d9e7515" : "#fff", color:iApproved ? "#1d9e75" : "#888", fontFamily:FONT }}>
              {iApproved ? "✓ Accepted" : "Accept"}
            </button>
            <span style={{ fontSize:11, color:"#bbb" }}>{ag.approvals.length}/{participants.length} accepted</span>
            {allApproved && <span style={{ fontSize:11, fontWeight:700, color:"#1d9e75" }}>✓ All agreed!</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiPost(action: string, data: Record<string, unknown>): Promise<CultureSession | null> {
  const res = await fetch("/api/games/culture/session", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ action, ...data }),
  });
  if (!res.ok) return null;
  return res.json();
}
async function apiGet(id: string): Promise<CultureSession | null> {
  const res = await fetch(`/api/games/culture/session?id=${id}`);
  if (!res.ok) return null;
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

type UIPhase = "start" | "join" | "lobby" | "scoring" | "discussing" | "done";

function CultureInner() {
  const searchParams = useSearchParams();
  const urlSid = searchParams.get("s");
  const isGuest = !!urlSid;

  const [uiPhase, setUiPhase]   = useState<UIPhase>(urlSid ? "join" : "start");
  const [sessionId, setSessionId] = useState(urlSid ?? "");
  const [myName, setMyName]     = useState("");
  const [nameInput, setNameInput] = useState("");
  const [session, setSession]   = useState<CultureSession | null>(null);
  const [joinError, setJoinError] = useState("");

  // Scoring state
  const [answers, setAnswers]     = useState<number[]>([0, 0, 0]);
  const [submitted, setSubmitted] = useState(false);
  const [currentQ, setCurrentQ]  = useState(0); // which of the 3 questions we're on
  const currentQRef = useRef(0);                 // ref to avoid stale closure
  const answersRef  = useRef<number[]>([0,0,0]); // ref to avoid stale closure

  // Agreements
  const [loadingAg, setLoadingAg] = useState(false);

  // Done/guidance
  const [guidance, setGuidance] = useState<{dimension:string; watchOut:string; tip:string}[]>([]);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [copied, setCopied]           = useState(false);
  const [proposalText, setProposalText]   = useState("");
  const [showProposalInput, setShowProposalInput] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/games/culture?s=${sessionId}` : "";

  // Poll
  const doPoll = useCallback(async () => {
    if (!sessionId) return;
    const s = await apiGet(sessionId);
    if (!s) return;
    setSession(s);
    if (s.phase === "running" && uiPhase === "lobby") setUiPhase("scoring");
    if (s.dimPhase === "discussing" && uiPhase === "scoring") { setUiPhase("discussing"); setSubmitted(false); setAnswers([0,0,0]); }
    if (s.dimPhase === "scoring" && uiPhase === "discussing") { setUiPhase("scoring"); setSubmitted(false); setAnswers([0,0,0]); setCurrentQ(0); currentQRef.current = 0; answersRef.current = [0,0,0]; }
    if (s.phase === "done" && uiPhase !== "done") setUiPhase("done");
  }, [sessionId, uiPhase]);

  useEffect(() => {
    if (!sessionId || uiPhase === "start" || uiPhase === "join" || uiPhase === "done") return;
    const t = setInterval(doPoll, 3000);
    return () => clearInterval(t);
  }, [sessionId, uiPhase, doPoll]);

  const dim = session ? DIMENSIONS[session.currentDim] : null;
  const allScored = session ? session.participants.every(p => session.scores[p]) : false;
  const dimScores: Record<string, number> = {};
  if (session && allScored) {
    session.participants.forEach(p => {
      const ans = session.scores[p] ?? [3,3,3];
      dimScores[p] = Math.round(ans.reduce((a,b) => a+b,0) / ans.length);
    });
  }
  const allAgreementsAccepted = (session?.agreements?.length ?? 0) > 0 &&
    (session?.agreements ?? []).every(ag => (session?.participants ?? []).every(p => ag.approvals.includes(p)));

  // ── Start ──
  if (uiPhase === "start") return wrap(<>
    <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.5px", color:"#111", margin:"0 0 8px" }}>Everyone Culture</h1>
    <p style={{ fontSize:15, color:"#888", margin:"0 0 28px", lineHeight:1.6 }}>
      Map your team's culture across 8 dimensions — surface hidden differences and turn them into agreements.
    </p>
    <div style={{ background:`${COLOR}10`, border:`1.5px solid ${COLOR}30`, borderRadius:14, padding:"16px 20px", marginBottom:28 }}>
      {DIMENSIONS.map((d, i) => (
        <div key={d.name} style={{ display:"flex", gap:10, marginBottom: i<7 ? 8:0 }}>
          <span style={{ fontSize:14 }}>{d.icon}</span>
          <span style={{ fontSize:13, color:"#666" }}><strong style={{ color:COLOR }}>{d.name}</strong> — {d.leftLabel} ↔ {d.rightLabel}</span>
        </div>
      ))}
    </div>
    <label style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", display:"block", marginBottom:8 }}>YOUR NAME</label>
    <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Enter your name…" autoFocus style={{ ...inputSt(), marginBottom:14 }} />
    <button disabled={!nameInput.trim()} onClick={async () => {
      const name = nameInput.trim();
      const s = await apiPost("create", { hostName: name });
      if (s) { setMyName(name); setSessionId(s.id); setSession(s); setUiPhase("lobby"); }
    }} style={{ width:"100%", padding:"14px", borderRadius:12, fontSize:15, fontWeight:600, cursor:nameInput.trim() ? "pointer":"not-allowed", border:"none", fontFamily:FONT, background:nameInput.trim() ? COLOR:"#e8e8e8", color:nameInput.trim() ? "#fff":"#bbb" }}>
      Create session →
    </button>
  </>);

  // ── Join ──
  if (uiPhase === "join") return wrap(<>
    <h2 style={{ fontSize:20, fontWeight:700, color:"#111", margin:"0 0 8px" }}>Join Culture Session</h2>
    <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Your name…" autoFocus style={{ ...inputSt(), marginBottom:12 }} />
    {joinError && <p style={{ fontSize:13, color:"#d4537e", margin:"0 0 12px", padding:"10px 14px", background:"#d4537e10", borderRadius:8 }}>{joinError}</p>}
    <button disabled={!nameInput.trim()} onClick={async () => {
      const name = nameInput.trim();
      setJoinError("");
      const s = await apiPost("join", { id: sessionId, name });
      if (!s) { setJoinError("Session not found."); return; }
      setMyName(name); setSession(s);
      setUiPhase(s.phase === "running" ? "scoring" : "lobby");
    }} style={{ width:"100%", padding:"14px", borderRadius:12, fontSize:15, fontWeight:600, cursor:nameInput.trim() ? "pointer":"not-allowed", border:"none", fontFamily:FONT, background:nameInput.trim() ? COLOR:"#e8e8e8", color:nameInput.trim() ? "#fff":"#bbb" }}>
      Join →
    </button>
  </>);

  // ── Lobby ──
  if (uiPhase === "lobby" && session) {
    const isHost = session.hostName === myName;
    return wrap(<>
      <h2 style={{ fontSize:20, fontWeight:700, color:"#111", margin:"0 0 20px" }}>Waiting room · {session.participants.length} joined</h2>
      <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #eee", padding:"16px 20px", marginBottom:16 }}>
        {session.participants.map(p => (
          <div key={p} style={{ display:"flex", gap:10, padding:"6px 0", borderBottom:"1px solid #f5f5f5" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:COLOR, marginTop:5, flexShrink:0 }} />
            <span style={{ fontSize:14, color:"#333" }}>{p}</span>
            {p === session.hostName && <span style={{ fontSize:11, color:"#bbb", marginLeft:"auto" }}>host</span>}
          </div>
        ))}
      </div>
      {isHost && (
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:12, color:"#aaa", margin:"0 0 8px" }}>Share this link:</p>
          <div style={{ display:"flex", gap:8 }}>
            <input readOnly value={shareUrl} style={{ ...inputSt(), fontSize:12, flex:1 }} />
            <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{ padding:"12px 14px", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", border:`1.5px solid ${COLOR}50`, background:`${COLOR}08`, color:COLOR, fontFamily:FONT, whiteSpace:"nowrap" }}>Copy →</button>
          </div>
        </div>
      )}
      {isHost ? (
        <button disabled={session.participants.length < 2} onClick={async () => {
          const s = await apiPost("start", { id: sessionId });
          if (s) { setSession(s); setUiPhase("scoring"); }
        }} style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:600, cursor:session.participants.length >= 2 ? "pointer":"not-allowed", border:"none", fontFamily:FONT, background:session.participants.length >= 2 ? COLOR:"#e8e8e8", color:session.participants.length >= 2 ? "#fff":"#bbb" }}>
          {session.participants.length < 2 ? "Waiting for more people…" : "Start assessment →"}
        </button>
      ) : (
        <p style={{ fontSize:14, color:"#aaa", textAlign:"center" }}>Waiting for host to start…</p>
      )}
    </>);
  }

  // ── Scoring ──
  if (uiPhase === "scoring" && session && dim) {
    const mySubmitted = !!session.scores[myName];

    if (mySubmitted) return wrap(
      <div style={{ textAlign:"center", padding:"60px 0" }}>
        <div style={{ width:48, height:48, border:`3px solid ${COLOR}30`, borderTopColor:COLOR, borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 20px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize:15, color:"#888", margin:"0 0 6px" }}>Your scores are in!</p>
        <p style={{ fontSize:13, color:"#bbb" }}>{Object.keys(session.scores).length} / {session.participants.length} done</p>
      </div>
    );

    const qIdx = Math.min(currentQ, 2) as 0|1|2;
    const questionText = dim.questions[qIdx];
    const questionOpts = dim.options[qIdx];

    async function handlePick(value: number) {
      // Use refs to avoid stale closures
      const q = currentQRef.current;
      if (q > 2) return; // guard
      const next = [...answersRef.current];
      next[q] = value;
      answersRef.current = next;
      setAnswers([...next]);
      if (q < 2) {
        currentQRef.current = q + 1;
        setCurrentQ(q + 1);
      } else {
        // All 3 answered — submit
        const s = await apiPost("submit-scores", { id: sessionId, name: myName, answers: next });
        if (s) { setSession(s); if (s.dimPhase === "discussing") setUiPhase("discussing"); }
      }
    }

    return wrap(<>
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        {DIMENSIONS.map((d, i) => (
          <div key={d.name} style={{ width:24, height:6, borderRadius:3, background: i < session.currentDim ? "#1d9e75" : i === session.currentDim ? COLOR : "#e0e0e0" }} />
        ))}
      </div>
      <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 4px" }}>
        DIMENSION {session.currentDim + 1} OF 8 · QUESTION {qIdx + 1} OF 3
      </p>
      <div style={{ display:"flex", gap:5, marginBottom:20 }}>
        {[0,1,2].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i < qIdx ? dim.color : i === qIdx ? `${dim.color}60` : "#e8e8e8" }} />)}
      </div>
      <h2 style={{ fontSize:20, fontWeight:700, color:dim.color, margin:"0 0 4px" }}>{dim.icon} {dim.name}</h2>
      <p style={{ fontSize:13, color:"#aaa", margin:"0 0 20px" }}>{dim.leftLabel} ↔ {dim.rightLabel}</p>

      <div style={{ background:"#fff", borderRadius:14, border:`1.5px solid ${dim.color}30`, padding:"18px 18px", marginBottom:14 }}>
        <p style={{ fontSize:15, fontWeight:600, color:"#333", margin:"0 0 16px", lineHeight:1.5 }}>{questionText}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {questionOpts.map((opt, oi) => (
            <button key={oi} onClick={() => handlePick(oi + 1)} style={{
              padding:"11px 16px", borderRadius:10, fontSize:13, cursor:"pointer", textAlign:"left",
              border:`1.5px solid ${dim.color}30`, background:"#fafafa", color:"#555", fontFamily:FONT,
            }}>
              <span style={{ fontSize:11, color:"#bbb", marginRight:8 }}>{oi + 1}</span>{opt}
            </button>
          ))}
        </div>
      </div>
    </>);
  }

  // ── Discussing ──
  if (uiPhase === "discussing" && session && dim) {
    const isHost = session.hostName === myName;

    return wrap(<>
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {DIMENSIONS.map((d, i) => (
          <div key={d.name} style={{ width:24, height:6, borderRadius:3, background: i < session.currentDim ? "#1d9e75" : i === session.currentDim ? COLOR : "#e0e0e0" }} />
        ))}
      </div>
      <h2 style={{ fontSize:20, fontWeight:700, color:dim.color, margin:"0 0 4px" }}>{dim.icon} {dim.name} — Team Results</h2>
      <p style={{ fontSize:13, color:"#aaa", margin:"0 0 16px" }}>{dim.leftLabel} ↔ {dim.rightLabel}</p>

      <ScaleVisual scores={dimScores} dim={dim} color={dim.color} />

      {/* Friction points with real names */}
      {(() => {
        const highNames = Object.entries(dimScores).filter(([,s]) => s >= 4).map(([n]) => n);
        const lowNames  = Object.entries(dimScores).filter(([,s]) => s <= 3).map(([n]) => n);
        const subst = (txt: string) => txt
          .replace(/high scorers?/gi, highNames.length ? highNames.join(" & ") : "higher scorers")
          .replace(/low scorers?/gi,  lowNames.length  ? lowNames.join(" & ")  : "lower scorers");
        return (
          <div style={{ background:"#fff8f0", border:"1.5px solid #e07a3a30", borderRadius:12, padding:"14px 18px", marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#e07a3a", letterSpacing:"0.07em", margin:"0 0 8px" }}>POSSIBLE FRICTION POINTS</p>
            {dim.problems.map((p, i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom: i<2 ? 6:0 }}>
                <span style={{ color:"#e07a3a", flexShrink:0 }}>→</span>
                <span style={{ fontSize:13, color:"#666" }}>{subst(p)}</span>
              </div>
            ))}
          </div>
        );
      })()}

      <p style={{ fontSize:14, fontWeight:600, color:"#333", margin:"0 0 12px" }}>Discuss → then handle agreements:</p>

      {/* Agreements area */}
      {(() => {
        return (
          <>
            {/* Action buttons */}
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <button disabled={loadingAg} onClick={async () => {
                setLoadingAg(true);
                const dimInfo = { name: dim.name, leftLabel: dim.leftLabel, rightLabel: dim.rightLabel };
                const res = await fetch("/api/games/culture/agreements", {
                  method:"POST", headers:{"Content-Type":"application/json"},
                  body: JSON.stringify({ dimension: dimInfo, scores: dimScores, participants: session.participants }),
                });
                const { agreements: texts } = await res.json();
                const s = await apiPost("set-agreements", { id: sessionId, agreements: texts });
                if (s) setSession(s);
                setLoadingAg(false);
              }} style={{ padding:"9px 14px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", border:`1.5px solid ${dim.color}50`, background:`${dim.color}08`, color:loadingAg ? "#bbb" : dim.color, fontFamily:FONT }}>
                {loadingAg ? "Generating…" : "✦ Generate proposals"}
              </button>
              <button onClick={() => setShowProposalInput(v => !v)} style={{ padding:"9px 14px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", border:"1.5px solid #e0e0e0", background:"#fff", color:"#555", fontFamily:FONT }}>
                + Add a proposal
              </button>
              {(() => {
                const myNone = (session.noneNeededApprovals ?? []).includes(myName);
                const noneCount = (session.noneNeededApprovals ?? []).length;
                const allNone = noneCount === session.participants.length;
                return (
                  <button onClick={async () => {
                    const s = await apiPost("toggle-none-needed", { id: sessionId, name: myName });
                    if (s) { setSession(s); if (s.dimPhase === "scoring") { setAnswers([0,0,0]); setCurrentQ(0); currentQRef.current = 0; answersRef.current = [0,0,0]; setUiPhase(s.phase === "done" ? "done" : "scoring"); } }
                  }} style={{ padding:"9px 14px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", border:`1.5px solid ${myNone ? "#1d9e75" : "#bbb"}`, background:myNone ? "#1d9e7515":"#fafafa", color:myNone ? "#1d9e75":"#888", fontFamily:FONT }}>
                    {allNone ? "Advancing…" : `None needed ${noneCount > 0 ? `(${noneCount}/${session.participants.length})` : ""}`}
                  </button>
                );
              })()}
            </div>

            {showProposalInput && (
              <div style={{ background:"#fff", borderRadius:12, border:"1.5px solid #e0e0e0", padding:"12px 14px", marginBottom:10 }}>
                <input value={proposalText} onChange={e => setProposalText(e.target.value)} placeholder="Write your proposal…" style={{ ...inputSt(), marginBottom:8 }} />
                <button disabled={!proposalText.trim()} onClick={async () => {
                  const s = await apiPost("add-agreement", { id: sessionId, text: proposalText.trim() });
                  if (s) { setSession(s); setProposalText(""); setShowProposalInput(false); }
                }} style={{ padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:dim.color, color:"#fff", fontFamily:FONT }}>
                  Add →
                </button>
              </div>
            )}

            {session.agreements.length > 0 && (
              <>
                <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.07em", margin:"0 0 10px" }}>PROPOSALS — accept each individually</p>
                {session.agreements.map(ag => (
                  <AgreementCard key={ag.id} ag={ag} myName={myName} participants={session.participants}
                    onApprove={async () => {
                      const s = await apiPost("approve-agreement", { id: sessionId, agId: ag.id, name: myName });
                      if (s) setSession(s);
                    }}
                    onEdit={async (text) => {
                      const s = await apiPost("edit-agreement", { id: sessionId, agId: ag.id, text });
                      if (s) setSession(s);
                    }}
                  />
                ))}

                {allAgreementsAccepted && isHost && (
                  <button onClick={async () => {
                    const s = await apiPost("advance-dimension", { id: sessionId });
                    if (s) { setSession(s); setAnswers([0,0,0]); setCurrentQ(0); currentQRef.current = 0; answersRef.current = [0,0,0]; setSubmitted(false); setUiPhase(s.phase === "done" ? "done" : "scoring"); }
                  }} style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:"none", fontFamily:FONT, background:"#1d9e75", color:"#fff", marginTop:8 }}>
                    {session.currentDim < 7 ? `Continue to ${DIMENSIONS[session.currentDim + 1]?.name} →` : "Complete assessment →"}
                  </button>
                )}
                {allAgreementsAccepted && !isHost && (
                  <p style={{ fontSize:13, color:"#1d9e75", textAlign:"center", marginTop:8, fontWeight:600 }}>✓ All accepted — waiting for host to advance</p>
                )}
                {!allAgreementsAccepted && (
                  <p style={{ fontSize:12, color:"#aaa", textAlign:"center", marginTop:8 }}>Everyone must accept all proposals to continue</p>
                )}
              </>
            )}
          </>
        );
      })()}
    </>);
  }

  // ── Done ──
  if (uiPhase === "done" && session) {
    const agreementsText = DIMENSIONS.map((d, i) => {
      const ags = session.allAgreements[i] ?? [];
      if (ags.length === 0) return `${d.icon} ${d.name}: No agreements`;
      return `${d.icon} ${d.name}:\n${ags.map((a, n) => `  ${n+1}. ${a}`).join("\n")}`;
    }).join("\n\n");

    const guideText = guidance.length > 0
      ? `EVERYONE CULTURE — PERSONAL GUIDE\n${myName}\n\n` +
        guidance.map(g => `${g.dimension}\nWatch out for: ${g.watchOut}\nTip: ${g.tip}`).join("\n\n")
      : "";

    const fullCopyText = `EVERYONE CULTURE — ${session.participants.join(", ")}\n\nAGREEMENTS BY DIMENSION:\n\n${agreementsText}`;

    async function generateGuide() {
      if (!session) return;
      setLoadingGuide(true);
      try {
        const res = await fetch("/api/games/culture/guidance", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            myName, allScores: session.allScores,
            participants: session.participants,
            dimensions: DIMENSIONS.map(d => ({ name:d.name, leftLabel:d.leftLabel, rightLabel:d.rightLabel })),
            allAgreements: session.allAgreements,
          }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (Array.isArray(data.guidance)) setGuidance(data.guidance);
        else throw new Error("Bad response");
      } catch (e) {
        console.error("Guidance failed:", e);
      } finally {
        setLoadingGuide(false);
      }
    }

    return wrap(<>
      {/* Progress bar — all green */}
      <div style={{ display:"flex", gap:6, marginBottom:20 }}>
        {DIMENSIONS.map((d) => <div key={d.name} style={{ flex:1, height:6, borderRadius:3, background:"#1d9e75" }} />)}
      </div>

      <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 4px" }}>ASSESSMENT COMPLETE</p>
      <h2 style={{ fontSize:22, fontWeight:700, color:COLOR, margin:"0 0 20px" }}>All 8 dimensions mapped!</h2>

      {/* Agreements per dimension */}
      <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 12px" }}>TEAM AGREEMENTS</p>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
        {DIMENSIONS.map((d, i) => {
          const ags = session.allAgreements[i] ?? [];
          const myScore = session.allScores[myName]?.[i] ?? 0;
          return (
            <div key={d.name} style={{ background:"#fff", borderRadius:12, border:"1.5px solid #eee", overflow:"hidden" }}>
              <div style={{ background:`${d.color}08`, borderBottom:"1px solid #eee", padding:"8px 14px", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:15 }}>{d.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color:d.color, flex:1 }}>{d.name}</span>
                <span style={{ fontSize:11, color:d.color, background:`${d.color}15`, borderRadius:6, padding:"2px 8px" }}>You: {myScore}/6</span>
              </div>
              <div style={{ padding:"10px 14px" }}>
                {ags.length === 0
                  ? <span style={{ fontSize:12, color:"#ccc" }}>No agreements</span>
                  : ags.map((a, n) => (
                    <div key={n} style={{ display:"flex", gap:8, marginBottom: n < ags.length-1 ? 6 : 0 }}>
                      <span style={{ fontSize:12, color:d.color, fontWeight:700, flexShrink:0 }}>{n+1}.</span>
                      <span style={{ fontSize:13, color:"#555", lineHeight:1.4 }}>{a}</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Copy agreements */}
      <button onClick={() => { navigator.clipboard.writeText(fullCopyText); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ width:"100%", padding:"11px", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT, border:`1.5px solid ${copied ? "#1d9e75" : "#ddd"}`, background:copied ? "#1d9e7515":"#fff", color:copied ? "#1d9e75":"#555", transition:"all 0.2s", marginBottom:20 }}>
        {copied ? "Copied ✓" : "Copy all agreements to clipboard"}
      </button>

      {/* Personal guide */}
      {guidance.length === 0 ? (
        <button onClick={generateGuide} disabled={loadingGuide} style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:"none", fontFamily:FONT, background:loadingGuide ? "#e8e8e8":COLOR, color:loadingGuide ? "#bbb":"#fff" }}>
          {loadingGuide ? "Generating your personal guide…" : "Generate my personal guide →"}
        </button>
      ) : (
        <>
          <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 12px" }}>YOUR PERSONAL GUIDE — {myName.toUpperCase()}</p>
          {guidance.map((g, i) => (
            <div key={i} style={{ background:"#fff", borderRadius:12, border:`1.5px solid ${DIMENSIONS[i]?.color ?? "#eee"}30`, padding:"14px 16px", marginBottom:10 }}>
              <p style={{ fontSize:12, fontWeight:700, color:DIMENSIONS[i]?.color ?? COLOR, margin:"0 0 6px" }}>{DIMENSIONS[i]?.icon} {g.dimension}</p>
              <p style={{ fontSize:13, color:"#555", margin:"0 0 4px", lineHeight:1.5 }}><strong>Watch out for:</strong> {g.watchOut}</p>
              <p style={{ fontSize:13, color:"#1d9e75", margin:0, lineHeight:1.5 }}>💡 {g.tip}</p>
            </div>
          ))}
          <button onClick={() => { navigator.clipboard.writeText(guideText); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ width:"100%", padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:FONT, border:`1.5px solid ${copied ? "#1d9e75":"#ddd"}`, background:copied ? "#1d9e7515":"#fff", color:copied ? "#1d9e75":"#555", transition:"all 0.2s" }}>
            {copied ? "Copied ✓" : "Copy personal guide to clipboard"}
          </button>
        </>
      )}
    </>);
  }

  return null;
}

export default function CulturePage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#f7f7f5" }} />}>
      <CultureInner />
    </Suspense>
  );
}
