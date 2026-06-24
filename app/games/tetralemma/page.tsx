"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { TetralemmaSession } from "@/lib/tetralemmaStore";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLOR  = "#1abc9c";
const FONT   = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const PHASE_COLORS = {
  flip: "#e07a3a", both: "#1d9e75", neither: "#7c6fcd", tabula: "#333",
} as const;

function inputSt(): React.CSSProperties {
  return { width:"100%", fontSize:14, padding:"12px 16px", border:"1.5px solid #e0e0e0", borderRadius:12, outline:"none", boxSizing:"border-box", color:"#111", fontFamily:FONT, background:"#fff" };
}

function wrap(content: React.ReactNode) {
  return (
    <div style={{ minHeight:"100vh", background:"#f7f7f5", fontFamily:FONT }}>
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:10, background:"#fff", borderBottom:"1px solid #eee", padding:"0 28px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link href="/" style={{ fontSize:13, color:"#999", textDecoration:"none" }}>← CommLab</Link>
        <span style={{ fontSize:14, fontWeight:600, color:"#111" }}>Creative Idea Generation</span>
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

// ── Idea chips ────────────────────────────────────────────────────────────────

function IdeaBadge({ label, idea, color }: { label: string; idea: string; color: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:`${color}10`, border:`1.5px solid ${color}30`, borderRadius:20 }}>
      <span style={{ fontSize:11, fontWeight:700, color, letterSpacing:"0.06em" }}>{label}</span>
      <span style={{ fontSize:13, color:"#555", fontWeight:500 }}>{idea}</span>
    </div>
  );
}

// ── Context card ──────────────────────────────────────────────────────────────

function ContextCard({ text, color, label }: { text: string; color: string; label?: string }) {
  return (
    <div style={{ background:`${color}08`, border:`2px solid ${color}30`, borderRadius:14, padding:"18px 20px" }}>
      {label && <p style={{ fontSize:10, fontWeight:700, color, letterSpacing:"0.07em", margin:"0 0 8px" }}>{label}</p>}
      <p style={{ fontSize:14, color:"#444", lineHeight:1.7, margin:0 }}>{text}</p>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 0" }}>
      <div style={{ width:32, height:32, border:`3px solid ${COLOR}30`, borderTopColor:COLOR, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function generateContext(challenge: string, ideaA: string, ideaB: string, position: string, side?: string, contextIndex = 1): Promise<string> {
  const res = await fetch("/api/games/tetralemma/context", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ challenge, ideaA, ideaB, position, side, contextIndex }),
  });
  const { context } = await res.json();
  return context ?? "";
}

async function sessionPost(action: string, data: Record<string, unknown>): Promise<TetralemmaSession | null> {
  const res = await fetch("/api/games/tetralemma/session", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ action, ...data }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function sessionGet(id: string): Promise<TetralemmaSession | null> {
  const res = await fetch(`/api/games/tetralemma/session?id=${id}`);
  if (!res.ok) return null;
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Mode = "start" | "solo" | "pair-create" | "pair-join" | "pair-lobby" | "pair-ideas" | "pair-waiting-idea" | "done";
type TetPhase = "flip" | "both" | "neither" | "tabula";

function TetralemmaInner() {
  const searchParams = useSearchParams();
  const urlSid = searchParams.get("s");
  const urlRole = searchParams.get("r"); // "guest"

  // ── Global state ──
  const [mode, setMode]           = useState<Mode>(urlSid ? "pair-join" : "start");
  const [challenge, setChallenge] = useState("");
  const [isPair, setIsPair]       = useState(false);
  const [myName, setMyName]       = useState("");
  const [nameInput, setNameInput] = useState("");

  // ── Solo/shared tetralemma state ──
  const [ideaA, setIdeaA]         = useState("");
  const [ideaB, setIdeaB]         = useState("");
  const [ideaAInput, setIdeaAInput] = useState("");
  const [ideaBInput, setIdeaBInput] = useState("");
  const [phase, setPhase]         = useState<TetPhase>("flip");
  const [side, setSide]           = useState<"A"|"B">("A");
  const [flipContext, setFlipContext] = useState("");
  const [bothContexts, setBothContexts] = useState<string[]>([]);
  const [neitherContexts, setNeitherContexts] = useState<string[]>([]);
  const [solution, setSolution]   = useState("");
  const [loading, setLoading]     = useState(false);

  // ── Pair state ──
  const [sessionId, setSessionId] = useState(urlSid ?? "");
  const [session, setSession]     = useState<TetralemmaSession | null>(null);
  const [joinError, setJoinError] = useState("");
  const [myIdea, setMyIdea]       = useState("");

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/games/tetralemma?s=${sessionId}&r=guest` : "";
  const isHost   = !urlRole;
  const isGuest  = urlRole === "guest";

  // ── Pair polling ──
  const doPoll = useCallback(async () => {
    if (!sessionId) return;
    const s = await sessionGet(sessionId);
    if (s) setSession(s);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || mode === "start" || mode === "pair-join" || mode === "done") return;
    const t = setInterval(doPoll, 3000);
    return () => clearInterval(t);
  }, [sessionId, mode, doPoll]);

  // Sync pair session phase → local state
  useEffect(() => {
    if (!session) return;
    // Auto-advance when session phase changes — only HOST generates first context
    if (session.phase === "both"    && phase === "flip") {
      setPhase("both");
      if (isHost) { setLoading(true); generateContext(session.challenge, session.ideaA, session.ideaB, "both", undefined, 1).then(ctx => { setBothContexts([ctx]); setLoading(false); sessionPost("add-context", { id: sessionId, position: "both", context: ctx }); }); }
    }
    if (session.phase === "neither" && phase === "both") {
      setPhase("neither");
      if (isHost) { setLoading(true); generateContext(session.challenge, session.ideaA, session.ideaB, "neither", undefined, 1).then(ctx => { setNeitherContexts([ctx]); setLoading(false); sessionPost("add-context", { id: sessionId, position: "neither", context: ctx }); }); }
    }
    if (session.phase === "tabula"  && phase === "neither") { setPhase("tabula"); }

    if (session.phase === "flip") {
      if (mode !== "solo") setPhase("flip");
      if (session.currentContext) setFlipContext(session.currentContext);
      if (session.currentSide)    setSide(session.currentSide);
      setIdeaA(session.ideaA); setIdeaB(session.ideaB);
      if (session.ideaA && session.ideaB) {
        if (mode === "pair-waiting-idea") setMode("pair-ideas");
        // If already in tetralemma
      }
    }
    if (session.phase === "both")    { setPhase("both");    setBothContexts(session.bothContexts); }
    if (session.phase === "neither") { setPhase("neither"); setNeitherContexts(session.neitherContexts); }
    if (session.phase === "tabula")  { setPhase("tabula"); }
    if (session.phase === "done")    { setSolution(session.solution); setMode("done"); }
    // Update both/neither contexts from session
    if (session.bothContexts.length)    setBothContexts(session.bothContexts);
    if (session.neitherContexts.length) setNeitherContexts(session.neitherContexts);
    if (session.currentContext && session.phase === "flip") setFlipContext(session.currentContext);
    if (session.currentSide    && session.phase === "flip") setSide(session.currentSide);
  }, [session, mode]);

  // ── START screen ──
  if (mode === "start") return wrap(<>
    <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.5px", color:"#111", margin:"0 0 8px" }}>Creative Idea Generation</h1>
    <p style={{ fontSize:15, color:"#888", margin:"0 0 28px", lineHeight:1.6 }}>
      Two ideas in tension? Work through all four logical positions — and discover the fifth.
    </p>
    <div style={{ background:`${COLOR}10`, border:`1.5px solid ${COLOR}30`, borderRadius:14, padding:"16px 20px", marginBottom:28 }}>
      {([
        { color: PHASE_COLORS.flip,    text: <>See context where either A <strong>OR</strong> B work.</> },
        { color: PHASE_COLORS.both,    text: <>See contexts where A <strong>AND</strong> B work at the same time.</> },
        { color: PHASE_COLORS.neither, text: <>See contexts where A <strong>NOR</strong> B work.</> },
        { color: PHASE_COLORS.tabula,  text: <>Tabula Rasa — write what wants to emerge.</> },
      ]).map(({ color, text }, i) => (
        <div key={i} style={{ display:"flex", gap:12, marginBottom: i < 3 ? 10 : 0 }}>
          <span style={{ fontSize:11, fontWeight:700, color, minWidth:18 }}>{i+1}</span>
          <span style={{ fontSize:13, color:"#666" }}>{text}</span>
        </div>
      ))}
    </div>
    <label style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", display:"block", marginBottom:8 }}>YOUR CHALLENGE</label>
    <input value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="What decision or tension are you exploring?" autoFocus style={{ ...inputSt(), marginBottom:16 }} />
    <div style={{ display:"flex", gap:10, marginBottom:20 }}>
      <button onClick={() => setIsPair(false)} style={{ flex:1, padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:`1.5px solid ${!isPair ? COLOR : "#e0e0e0"}`, background:!isPair ? `${COLOR}10` : "#fff", color:!isPair ? COLOR : "#888", fontFamily:FONT }}>
        🔍 Solo
      </button>
      <button onClick={() => setIsPair(true)} style={{ flex:1, padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:`1.5px solid ${isPair ? COLOR : "#e0e0e0"}`, background:isPair ? `${COLOR}10` : "#fff", color:isPair ? COLOR : "#888", fontFamily:FONT }}>
        👥 With a partner
      </button>
    </div>
    {isPair && <>
      <label style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", display:"block", marginBottom:8 }}>YOUR NAME</label>
      <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="Your name…" style={{ ...inputSt(), marginBottom:16 }} />
    </>}
    <button disabled={!challenge.trim() || (isPair && !myName.trim())} onClick={async () => {
      if (!isPair) { setMode("solo"); setPhase("flip"); setFlipContext(""); return; }
      const s = await sessionPost("create", { hostName: myName.trim(), challenge: challenge.trim() });
      if (s) { setSessionId(s.id); setSession(s); setMode("pair-create"); }
    }} style={{ width:"100%", padding:"14px", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer", border:"none", fontFamily:FONT, background:challenge.trim() ? COLOR : "#e8e8e8", color:challenge.trim() ? "#fff" : "#bbb" }}>
      {isPair ? "Create session →" : "Start tetralemma →"}
    </button>
  </>);

  // ── PAIR CREATE (host waits for guest) ──
  if (mode === "pair-create") return wrap(<>
    <h2 style={{ fontSize:20, fontWeight:700, color:"#111", margin:"0 0 8px" }}>Waiting for your partner</h2>
    <p style={{ fontSize:14, color:"#888", margin:"0 0 20px" }}>Share this link — once they join, you'll each enter your idea.</p>
    <div style={{ display:"flex", gap:8, marginBottom:20 }}>
      <input readOnly value={shareUrl} style={{ ...inputSt(), fontSize:12, flex:1 }} />
      <CopyBtn url={shareUrl} />
    </div>
    {session?.guestName && (
      <div style={{ background:`${COLOR}10`, border:`1.5px solid ${COLOR}30`, borderRadius:12, padding:"14px 18px", marginBottom:16 }}>
        <p style={{ fontSize:14, color:COLOR, fontWeight:600, margin:0 }}>✓ {session.guestName} has joined!</p>
      </div>
    )}
    <button disabled={!session?.guestName} onClick={() => setMode("pair-ideas")} style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:600, cursor:session?.guestName ? "pointer" : "not-allowed", border:"none", fontFamily:FONT, background:session?.guestName ? COLOR : "#e8e8e8", color:session?.guestName ? "#fff" : "#bbb" }}>
      {session?.guestName ? "Both ready — enter your ideas →" : "Waiting for partner…"}
    </button>
  </>);

  // ── PAIR JOIN ──
  if (mode === "pair-join") return wrap(<>
    <h2 style={{ fontSize:20, fontWeight:700, color:"#111", margin:"0 0 8px" }}>Join Tetralemma</h2>
    <p style={{ fontSize:14, color:"#888", margin:"0 0 24px" }}>Your partner is waiting. Enter your name to join.</p>
    <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Your name…" autoFocus style={{ ...inputSt(), marginBottom:12 }} />
    {joinError && <p style={{ fontSize:13, color:"#d4537e", margin:"0 0 12px", padding:"10px 14px", background:"#d4537e10", borderRadius:8 }}>{joinError}</p>}
    <button disabled={!nameInput.trim()} onClick={async () => {
      setJoinError("");
      const s = await sessionPost("join", { id: sessionId, guestName: nameInput.trim() });
      if (!s) { setJoinError("Session not found."); return; }
      setMyName(nameInput.trim()); setChallenge(s.challenge);
      setSession(s); setMode("pair-ideas");
    }} style={{ width:"100%", padding:"14px", borderRadius:12, fontSize:15, fontWeight:600, cursor:nameInput.trim() ? "pointer" : "not-allowed", border:"none", fontFamily:FONT, background:nameInput.trim() ? COLOR : "#e8e8e8", color:nameInput.trim() ? "#fff" : "#bbb" }}>
      Join →
    </button>
  </>);

  // ── PAIR IDEAS entry ──
  if (mode === "pair-ideas" && session) {
    const myRole = isHost ? "host" : "guest";
    const myIdeaSubmitted = isHost ? !!session.ideaA : !!session.ideaB;
    const bothSubmitted = !!session.ideaA && !!session.ideaB;

    if (bothSubmitted) {
      // Auto-advance to tetralemma
      setIdeaA(session.ideaA); setIdeaB(session.ideaB);
      setPhase("flip");
      if (!flipContext) {
        setLoading(true);
        generateContext(session.challenge, session.ideaA, session.ideaB, "flip", "A").then(ctx => {
          setFlipContext(ctx); setSide("A"); setLoading(false);
          sessionPost("flip", { id: sessionId, side: "A", context: ctx });
        });
      }
      setMode("solo"); // Use solo flow for shared navigation
      return null;
    }

    return wrap(<>
      <p style={{ fontSize:12, color:"#aaa", margin:"0 0 4px" }}>{challenge}</p>
      <h2 style={{ fontSize:20, fontWeight:700, color:"#111", margin:"0 0 20px" }}>Enter your idea</h2>
      {myIdeaSubmitted ? (
        <div style={{ textAlign:"center", padding:"32px 0" }}>
          <p style={{ fontSize:15, color:"#888" }}>Your idea is in! Waiting for {isHost ? session.guestName : session.hostName}…</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize:13, color:"#888", margin:"0 0 14px" }}>
            {isHost ? `You are ${session.hostName} — enter Idea A` : `You are ${session.guestName} — enter Idea B`}
          </p>
          <input value={myIdea} onChange={e => setMyIdea(e.target.value)} placeholder="Your idea…" autoFocus style={{ ...inputSt(), marginBottom:14 }} />
          <button disabled={!myIdea.trim()} onClick={async () => {
            const s = await sessionPost("set-idea", { id: sessionId, role: myRole, idea: myIdea.trim() });
            if (s) setSession(s);
          }} style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:600, cursor:myIdea.trim() ? "pointer" : "not-allowed", border:"none", fontFamily:FONT, background:myIdea.trim() ? COLOR : "#e8e8e8", color:myIdea.trim() ? "#fff" : "#bbb" }}>
            Submit my idea →
          </button>
        </>
      )}
    </>);
  }

  // ── SOLO IDEA ENTRY ──
  if (mode === "solo" && !ideaA) return wrap(<>
    <p style={{ fontSize:12, color:"#aaa", margin:"0 0 4px" }}>{challenge}</p>
    <h2 style={{ fontSize:20, fontWeight:700, color:"#111", margin:"0 0 20px" }}>Enter the two ideas in tension</h2>
    <label style={{ fontSize:11, fontWeight:700, color:"#e07a3a", letterSpacing:"0.07em", display:"block", marginBottom:8 }}>IDEA A</label>
    <input value={ideaAInput} onChange={e => setIdeaAInput(e.target.value)} placeholder="First idea or position…" style={{ ...inputSt(), marginBottom:16 }} />
    <label style={{ fontSize:11, fontWeight:700, color:"#7c6fcd", letterSpacing:"0.07em", display:"block", marginBottom:8 }}>IDEA B</label>
    <input value={ideaBInput} onChange={e => setIdeaBInput(e.target.value)} placeholder="Second idea or position…" style={{ ...inputSt(), marginBottom:20 }} />
    <button disabled={!ideaAInput.trim() || !ideaBInput.trim()} onClick={async () => {
      setIdeaA(ideaAInput.trim()); setIdeaB(ideaBInput.trim());
      setLoading(true);
      const ctx = await generateContext(challenge, ideaAInput.trim(), ideaBInput.trim(), "flip", "A");
      setFlipContext(ctx); setSide("A"); setLoading(false);
    }} style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:"none", fontFamily:FONT, background:COLOR, color:"#fff" }}>
      Start the tetralemma →
    </button>
  </>);

  // ── TETRALEMMA PHASES ──
  if ((mode === "solo" || mode === "pair-ideas") && ideaA) {
    // parse bullet points from JSON context string
    const parseBullets = (raw: string): string[] => {
      try { const p = JSON.parse(raw); return Array.isArray(p.points) ? p.points : [raw]; }
      catch { return [raw]; }
    };

    const ChallengeHeading = () => (
      <h2 style={{ fontSize:18, fontWeight:700, color:"#111", margin:"0 0 16px", lineHeight:1.4 }}>
        Challenge: {challenge}
      </h2>
    );

    const IdeaBadges = () => (
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        <IdeaBadge label="A" idea={ideaA} color="#e07a3a" />
        <IdeaBadge label="B" idea={ideaB} color="#7c6fcd" />
      </div>
    );

    const BulletCard = ({ ctx, color, activeLabel, inactiveLabel }: { ctx: string; color: string; activeLabel: string; inactiveLabel: string }) => {
      const bullets = parseBullets(ctx);
      return (
        <div style={{ background:`${color}08`, border:`2px solid ${color}30`, borderRadius:14, padding:"16px 18px" }}>
          <div style={{ display:"flex", gap:16, marginBottom:12 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#fff", background:color, borderRadius:8, padding:"3px 10px" }}>{activeLabel} ✓</span>
            <span style={{ fontSize:12, fontWeight:600, color:"#bbb", textDecoration:"line-through" }}>{inactiveLabel}</span>
          </div>
          <ul style={{ margin:0, paddingLeft:20, display:"flex", flexDirection:"column", gap:6 }}>
            {bullets.map((b, i) => <li key={i} style={{ fontSize:13, color:"#444", lineHeight:1.5 }}>{b}</li>)}
          </ul>
        </div>
      );
    };

    const ContextBulletCard = ({ ctx, color, label }: { ctx: string; color: string; label: string }) => {
      const bullets = parseBullets(ctx);
      return (
        <div style={{ background:`${color}08`, border:`2px solid ${color}30`, borderRadius:14, padding:"14px 18px" }}>
          <p style={{ fontSize:10, fontWeight:700, color, letterSpacing:"0.07em", margin:"0 0 8px" }}>{label}</p>
          <ul style={{ margin:0, paddingLeft:18, display:"flex", flexDirection:"column", gap:5 }}>
            {bullets.map((b, i) => <li key={i} style={{ fontSize:13, color:"#444", lineHeight:1.5 }}>{b}</li>)}
          </ul>
        </div>
      );
    };

    // ── Both-ready gate (pair mode) ──
    const myRole = isHost ? "host" : "guest";
    const iAmReady = session ? (isHost ? session.readyHost : session.readyGuest) : false;
    const partnerReady = session ? (isHost ? session.readyGuest : session.readyHost) : false;
    const partnerName = session ? (isHost ? session.guestName : session.hostName) : "";

    const ReadyGate = ({ nextPhase, onSoloContinue }: { nextPhase: string; onSoloContinue: () => void }) => {
      if (!sessionId) {
        return (
          <button onClick={onSoloContinue} style={{ width:"100%", padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:"none", fontFamily:FONT, background:COLOR, color:"#fff" }}>
            Continue →
          </button>
        );
      }
      return (
        <div style={{ background:"#f9f9f7", border:"1.5px solid #e8e8e8", borderRadius:12, padding:"14px 16px" }}>
          <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.07em", margin:"0 0 10px" }}>BOTH NEED TO BE READY TO CONTINUE</p>
          <div style={{ display:"flex", gap:10, marginBottom:10 }}>
            <div style={{ flex:1, padding:"10px 14px", borderRadius:10, background: iAmReady ? `${COLOR}15` : "#fff", border:`1.5px solid ${iAmReady ? COLOR : "#e0e0e0"}`, textAlign:"center" }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#aaa", margin:"0 0 4px" }}>YOU</p>
              <p style={{ fontSize:13, fontWeight:600, color: iAmReady ? COLOR : "#bbb", margin:0 }}>{iAmReady ? "✓ Ready" : "Not yet"}</p>
            </div>
            <div style={{ flex:1, padding:"10px 14px", borderRadius:10, background: partnerReady ? `${COLOR}15` : "#fff", border:`1.5px solid ${partnerReady ? COLOR : "#e0e0e0"}`, textAlign:"center" }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#aaa", margin:"0 0 4px" }}>{partnerName.toUpperCase()}</p>
              <p style={{ fontSize:13, fontWeight:600, color: partnerReady ? COLOR : "#bbb", margin:0 }}>{partnerReady ? "✓ Ready" : "Not yet"}</p>
            </div>
          </div>
          <button onClick={async () => {
            const s = await sessionPost("toggle-ready", { id: sessionId, role: myRole, nextPhase });
            if (s) setSession(s);
          }} style={{ width:"100%", padding:"11px", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", border:`1.5px solid ${iAmReady ? "#d4537e" : COLOR}`, background: iAmReady ? "#d4537e10" : `${COLOR}10`, color: iAmReady ? "#d4537e" : COLOR, fontFamily:FONT }}>
            {iAmReady ? "↩ Not ready yet" : "✓ I'm ready to continue"}
          </button>
        </div>
      );
    };

    // ── FLIP ──
    if (phase === "flip") {
      const flipColor = side === "A" ? "#e07a3a" : "#7c6fcd";
      const activeLabel  = side === "A" ? "A Works" : "B Works";
      const inactiveLabel = side === "A" ? "B Does Not Work" : "A Does Not Work";
      return wrap(<>
        <ChallengeHeading />
        <IdeaBadges />
        <p style={{ fontSize:14, color:"#777", margin:"0 0 16px" }}>
          See context where either A <strong>OR</strong> B work.
        </p>

        {loading ? <Spinner /> : flipContext ? (
          <BulletCard ctx={flipContext} color={flipColor} activeLabel={activeLabel} inactiveLabel={inactiveLabel} />
        ) : null}

        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <button disabled={loading} onClick={async () => {
            setLoading(true);
            const newSide: "A"|"B" = side === "A" ? "B" : "A";
            const ctx = await generateContext(challenge, ideaA, ideaB, "flip", newSide);
            setSide(newSide); setFlipContext(ctx); setLoading(false);
            if (sessionId) sessionPost("flip", { id: sessionId, side: newSide, context: ctx });
          }} style={{ flex:1, padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:`1.5px solid ${loading ? "#e8e8e8" : flipColor}`, background:`${flipColor}10`, color:loading ? "#bbb" : flipColor, fontFamily:FONT }}>
            🔄 Flip — try the other side
          </button>
          <ReadyGate nextPhase="both" onSoloContinue={async () => {
            setPhase("both"); setLoading(true);
            const ctx = await generateContext(challenge, ideaA, ideaB, "both");
            setBothContexts([ctx]); setLoading(false);
            if (sessionId) {
              sessionPost("advance", { id: sessionId, phase: "both" });
              sessionPost("add-context", { id: sessionId, position: "both", context: ctx });
            }
          }} />
        </div>
      </>);
    }

    // ── BOTH ──
    if (phase === "both") {
      const c = PHASE_COLORS.both;
      return wrap(<>
        <ChallengeHeading />
        <IdeaBadges />
        <p style={{ fontSize:14, color:"#777", margin:"0 0 16px" }}>
          See contexts where A <strong>AND</strong> B work at the same time.
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {bothContexts.map((ctx, i) => <ContextBulletCard key={i} ctx={ctx} color={c} label={`Context ${i+1}`} />)}
          {loading && <Spinner />}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          {(() => {
            const myTurn = !sessionId || (session?.bothReshuffleRole === myRole);
            const partnerN = sessionId ? (isHost ? session?.guestName : session?.hostName) : "";
            const atMax = bothContexts.length >= 3;
            return myTurn ? (
              <button disabled={loading || atMax} onClick={async () => {
                setLoading(true);
                const nextIdx = bothContexts.length + 1;
                const ctx = await generateContext(challenge, ideaA, ideaB, "both", undefined, nextIdx);
                setBothContexts(prev => [...prev, ctx]); setLoading(false);
                if (sessionId) { sessionPost("add-context", { id: sessionId, position: "both", context: ctx }); sessionPost("flip-reshuffle-role", { id: sessionId, position: "both" }); }
              }} style={{ flex:1, padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, cursor: atMax || loading ? "not-allowed" : "pointer", border:`1.5px solid ${c}40`, background:`${c}08`, color: atMax ? "#bbb" : c, fontFamily:FONT }}>
                {atMax ? "Max 3 reached" : "✦ Reshuffle — add another"}
              </button>
            ) : (
              <div style={{ flex:1, padding:"12px", borderRadius:12, fontSize:13, color:"#aaa", border:"1.5px solid #eee", background:"#fafafa", display:"flex", alignItems:"center", justifyContent:"center" }}>
                Waiting for {partnerN} to reshuffle…
              </div>
            );
          })()}
          <ReadyGate nextPhase="neither" onSoloContinue={async () => {
            setPhase("neither"); setLoading(true);
            const ctx = await generateContext(challenge, ideaA, ideaB, "neither", undefined, 1);
            setNeitherContexts([ctx]); setLoading(false);
            if (sessionId) {
              sessionPost("advance", { id: sessionId, phase: "neither" });
              sessionPost("add-context", { id: sessionId, position: "neither", context: ctx });
            }
          }} />
        </div>
      </>);
    }

    // ── NEITHER ──
    if (phase === "neither") {
      const c = PHASE_COLORS.neither;
      return wrap(<>
        <ChallengeHeading />
        <IdeaBadges />
        <p style={{ fontSize:14, color:"#777", margin:"0 0 16px" }}>
          See contexts where A <strong>NOR</strong> B work.
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {neitherContexts.map((ctx, i) => <ContextBulletCard key={i} ctx={ctx} color={c} label={`Context ${i+1}`} />)}
          {loading && <Spinner />}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          {(() => {
            const myTurn2 = !sessionId || (session?.neitherReshuffleRole === myRole);
            const partnerN2 = sessionId ? (isHost ? session?.guestName : session?.hostName) : "";
            const atMax2 = neitherContexts.length >= 3;
            return myTurn2 ? (
              <button disabled={loading || atMax2} onClick={async () => {
                setLoading(true);
                const nextIdx = neitherContexts.length + 1;
                const ctx = await generateContext(challenge, ideaA, ideaB, "neither", undefined, nextIdx);
                setNeitherContexts(prev => [...prev, ctx]); setLoading(false);
                if (sessionId) { sessionPost("add-context", { id: sessionId, position: "neither", context: ctx }); sessionPost("flip-reshuffle-role", { id: sessionId, position: "neither" }); }
              }} style={{ flex:1, padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, cursor: atMax2 || loading ? "not-allowed" : "pointer", border:`1.5px solid ${c}40`, background:`${c}08`, color: atMax2 ? "#bbb" : c, fontFamily:FONT }}>
                {atMax2 ? "Max 3 reached" : "✦ Reshuffle — add another"}
              </button>
            ) : (
              <div style={{ flex:1, padding:"12px", borderRadius:12, fontSize:13, color:"#aaa", border:"1.5px solid #eee", background:"#fafafa", display:"flex", alignItems:"center", justifyContent:"center" }}>
                Waiting for {partnerN2} to reshuffle…
              </div>
            );
          })()}
          <ReadyGate nextPhase="tabula" onSoloContinue={() => setPhase("tabula")} />
        </div>
      </>);
    }

    // ── TABULA RASA ──
    if (phase === "tabula") {
      const isMulti = !!sessionId;
      return wrap(<>
        <ChallengeHeading />
        <p style={{ fontSize:14, color:"#555", margin:"0 0 20px", lineHeight:1.75 }}>
          Tabula rasa. Now your {isMulti ? "brains" : "brain"} {isMulti ? "have" : "has"} walked through and beyond your initial ideas, and {isMulti ? "are" : "is"} ready to intuitively come up with a new idea for the challenge — or even may change the challenge. Now write what wants to emerge.
        </p>
        <textarea
          value={solution}
          onChange={e => setSolution(e.target.value)}
          placeholder="The new answer, the third way, the unexpected solution…"
          rows={6}
          style={{ ...inputSt(), resize:"none", lineHeight:1.6, marginBottom:14 }}
        />
        <button disabled={!solution.trim()} onClick={async () => {
          if (sessionId) await sessionPost("set-solution", { id: sessionId, solution: solution.trim() });
          setMode("done");
        }} style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14, fontWeight:600, cursor:solution.trim() ? "pointer" : "not-allowed", border:"none", fontFamily:FONT, background:solution.trim() ? "#333" : "#e8e8e8", color:solution.trim() ? "#fff" : "#bbb" }}>
          Complete →
        </button>
      </>);
    }
  }

  // ── DONE ──
  if (mode === "done") return wrap(<>
    <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 4px" }}>TETRALEMMA COMPLETE</p>
    <h2 style={{ fontSize:22, fontWeight:700, color:COLOR, margin:"0 0 6px" }}>{challenge}</h2>
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
      <IdeaBadge label="A" idea={ideaA} color="#e07a3a" />
      <IdeaBadge label="B" idea={ideaB} color="#7c6fcd" />
    </div>
    <div style={{ background:"#333", borderRadius:14, padding:"24px 22px", marginBottom:28 }}>
      <p style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.08em", margin:"0 0 10px" }}>THE NEW ANSWER</p>
      <p style={{ fontSize:16, color:"#fff", lineHeight:1.7, margin:0 }}>{solution}</p>
    </div>
    <button onClick={() => { setMode("start"); setIdeaA(""); setIdeaB(""); setPhase("flip"); setFlipContext(""); setBothContexts([]); setNeitherContexts([]); setSolution(""); setChallenge(""); }} style={{ width:"100%", padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:"1.5px solid #ddd", background:"#fff", color:"#555", fontFamily:FONT }}>
      ↩ Start a new tetralemma
    </button>
  </>);

  return null;
}

function CopyBtn({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <style>{`@keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}`}</style>
      <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding:"12px 16px", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", border:`1.5px solid ${copied ? "#1d9e75" : `${COLOR}50`}`, background:copied ? "#1d9e7515" : `${COLOR}08`, color:copied ? "#1d9e75" : COLOR, fontFamily:FONT, whiteSpace:"nowrap", animation:copied ? "pop 0.25s ease" : "none" }}>
        {copied ? "Copied ✓" : "Copy →"}
      </button>
    </>
  );
}

export default function TetralemmaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#f7f7f5" }} />}>
      <TetralemmaInner />
    </Suspense>
  );
}
