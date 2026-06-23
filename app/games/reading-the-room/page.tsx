"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import mammoth from "mammoth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Speaker {
  name: string;
  mover: number; follower: number; opposer: number; bystander: number; other: number;
  dominantRole: string;
}

interface Analysis {
  status: "green" | "yellow" | "red";
  statusLabel: string;
  rule: string;
  ruleDesc: string;
  summary: string;
  percentages: { mover: number; follower: number; opposer: number; bystander: number; other: number };
  speakers: Speaker[];
  insights: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_COLORS = {
  mover:     "#378add",
  follower:  "#1d9e75",
  opposer:   "#d4537e",
  bystander: "#7c6fcd",
  other:     "#e0e0e0",
};
const ROLE_LABELS = { mover: "Mover", follower: "Follower", opposer: "Opposer", bystander: "Bystander", other: "Other" };
const STATUS_COLORS = { green: "#1d9e75", yellow: "#e07a3a", red: "#d4537e" };
const STATUS_BG    = { green: "#1d9e7518", yellow: "#e07a3a18", red: "#d4537e18" };
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// ── Donut chart ───────────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, outerR: number, innerR: number, start: number, end: number) {
  if (end - start >= 360) end = start + 359.99;
  const o1 = polar(cx, cy, outerR, start), o2 = polar(cx, cy, outerR, end);
  const i1 = polar(cx, cy, innerR, start), i2 = polar(cx, cy, innerR, end);
  const large = end - start > 180 ? 1 : 0;
  return `M${o1.x},${o1.y} A${outerR},${outerR} 0 ${large} 1 ${o2.x},${o2.y} L${i2.x},${i2.y} A${innerR},${innerR} 0 ${large} 0 ${i1.x},${i1.y}Z`;
}

function DonutChart({ pct }: { pct: Analysis["percentages"] }) {
  const cx = 110, cy = 110, outerR = 95, innerR = 58;
  const scored = pct.mover + pct.follower + pct.opposer + pct.bystander;
  const segments = [
    { key: "mover",     value: pct.mover },
    { key: "follower",  value: pct.follower },
    { key: "opposer",   value: pct.opposer },
    { key: "bystander", value: pct.bystander },
  ] as const;

  let cursor = 0;
  const paths = segments.map(seg => {
    const sweep = scored > 0 ? (seg.value / scored) * 360 : 0;
    const start = cursor, end = cursor + sweep;
    cursor = end;
    return { ...seg, path: arc(cx, cy, outerR, innerR, start, end) };
  });

  return (
    <svg viewBox={`0 0 ${cx * 2} ${cy * 2}`} style={{ width: "100%", maxWidth: 220, display: "block", margin: "0 auto" }}>
      {paths.map(p => p.value > 0 && (
        <path key={p.key} d={p.path} fill={ROLE_COLORS[p.key]} opacity={0.9} />
      ))}
      <circle cx={cx} cy={cy} r={innerR - 4} fill="white" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fill="#aaa" fontFamily={FONT}>scored turns</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="22" fontWeight="700" fill="#333" fontFamily={FONT}>
        {scored.toFixed(0)}%
      </text>
    </svg>
  );
}

// ── Speaker bar ───────────────────────────────────────────────────────────────

function SpeakerBar({ speaker }: { speaker: Speaker }) {
  const total = speaker.mover + speaker.follower + speaker.opposer + speaker.bystander + speaker.other;
  if (total === 0) return null;
  const roles = ["mover", "follower", "opposer", "bystander"] as const;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{speaker.name}</span>
        <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>
          {speaker.dominantRole !== "OTHER" ? speaker.dominantRole : "—"}
        </span>
      </div>
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "#f0f0f0" }}>
        {roles.map(r => {
          const pct = (speaker[r] / total) * 100;
          return pct > 0 ? (
            <div key={r} style={{ width: `${pct}%`, background: ROLE_COLORS[r], transition: "width 0.4s" }} title={`${ROLE_LABELS[r]}: ${pct.toFixed(0)}%`} />
          ) : null;
        })}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrap(content: React.ReactNode) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: FONT }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #eee", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← CommLab</Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Reading the Room</span>
        <span />
      </div>
      <div style={{ paddingTop: 52 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>
          {content}
        </div>
      </div>
    </div>
  );
}

// ── Upload step ───────────────────────────────────────────────────────────────

function UploadStep({ onAnalyze }: { onAnalyze: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);

  const handleFile = (f: File) => setSelected(f);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  return wrap(<>
    <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#111", margin: "0 0 8px" }}>Reading the Room</h1>
    <p style={{ fontSize: 15, color: "#888", margin: "0 0 32px", lineHeight: 1.6 }}>
      Upload a meeting transcript to reveal the hidden role dynamics — who moves, who follows, who opposes, who observes.
    </p>

    {/* Drop zone */}
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${dragging ? "#378add" : selected ? "#1d9e75" : "#d0d0d0"}`,
        borderRadius: 16,
        padding: "40px 24px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? "#378add08" : selected ? "#1d9e7508" : "#fafafa",
        transition: "all 0.2s",
        marginBottom: 20,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
      {selected ? (
        <>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1d9e75", margin: "0 0 4px" }}>{selected.name}</p>
          <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>{(selected.size / 1024).toFixed(0)} KB — click to change</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#555", margin: "0 0 6px" }}>Drop your transcript here</p>
          <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>or click to browse — PDF, Markdown, or plain text</p>
        </>
      )}
      <input ref={inputRef} type="file" accept=".pdf,.md,.txt,.text,.docx" style={{ display: "none" }}
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
    </div>

    {/* Format hints */}
    <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
      {["PDF", "Word (.docx)", "Markdown (.md)", "Granola export", "Plain text (.txt)"].map(f => (
        <span key={f} style={{ fontSize: 11, padding: "4px 10px", background: "#f0f0f0", borderRadius: 20, color: "#888" }}>{f}</span>
      ))}
    </div>

    <button
      onClick={() => selected && onAnalyze(selected)}
      disabled={!selected}
      style={{
        width: "100%", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
        cursor: selected ? "pointer" : "not-allowed", border: "none", fontFamily: FONT,
        background: selected ? "#378add" : "#e8e8e8",
        color: selected ? "#fff" : "#bbb",
      }}
    >
      Analyze transcript →
    </button>

    {/* Kantor legend */}
    <div style={{ marginTop: 36, background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "20px 22px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 14px" }}>KANTOR'S 4-PLAYER MODEL</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(["mover","follower","opposer","bystander"] as const).map(r => (
          <div key={r} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: ROLE_COLORS[r], flexShrink: 0, marginTop: 3 }} />
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: ROLE_COLORS[r] }}>{ROLE_LABELS[r]}</span>
              <span style={{ fontSize: 13, color: "#777", marginLeft: 6 }}>
                {r === "mover" && "— Initiates, proposes, moves forward"}
                {r === "follower" && "— Supports, builds on, enables movement"}
                {r === "opposer" && "— Challenges, questions, corrects"}
                {r === "bystander" && "— Observes, reflects, contextualizes"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>);
}

// ── Loading step ──────────────────────────────────────────────────────────────

function LoadingStep({ filename }: { filename: string }) {
  return wrap(
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ width: 48, height: 48, border: "3px solid #378add30", borderTopColor: "#378add", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize: 15, color: "#888", margin: "0 0 6px" }}>Analyzing transcript…</p>
      <p style={{ fontSize: 13, color: "#bbb" }}>{filename}</p>
    </div>
  );
}

// ── Results step ──────────────────────────────────────────────────────────────

function ResultsStep({ analysis, filename, onReset }: { analysis: Analysis; filename: string; onReset: () => void }) {
  const { status, statusLabel, rule, ruleDesc, summary, percentages, speakers, insights } = analysis;
  const statusColor = STATUS_COLORS[status];
  const statusBg    = STATUS_BG[status];

  const statusEmoji = { green: "🟢", yellow: "🟡", red: "🔴" }[status];
  const roles = ["mover","follower","opposer","bystander"] as const;

  return wrap(<>
    {/* Header */}
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 12, color: "#bbb", margin: "0 0 4px" }}>{filename}</p>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{
          background: statusBg, border: `2px solid ${statusColor}50`, borderRadius: 12,
          padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{statusEmoji}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: statusColor, letterSpacing: "0.04em" }}>
              {statusLabel.toUpperCase()}
            </div>
            {rule !== "—" && (
              <div style={{ fontSize: 11, color: statusColor, opacity: 0.7, marginTop: 2 }}>Rule {rule}</div>
            )}
          </div>
        </div>
        {ruleDesc && (
          <div style={{ flex: 1, minWidth: 180, background: statusBg, border: `1px solid ${statusColor}30`, borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.5 }}>{ruleDesc}</p>
          </div>
        )}
      </div>
    </div>

    {/* Summary */}
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "18px 22px", marginBottom: 20 }}>
      <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, margin: 0 }}>{summary}</p>
    </div>

    {/* Donut + Legend */}
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "22px", marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 16px" }}>ROLE DISTRIBUTION</p>
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 auto" }}>
          <DonutChart pct={percentages} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          {roles.map(r => (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: ROLE_COLORS[r], flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: ROLE_COLORS[r], minWidth: 72 }}>{ROLE_LABELS[r]}</span>
              <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${percentages[r]}%`, height: "100%", background: ROLE_COLORS[r], borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: percentages[r] === 0 ? "#ddd" : "#333", minWidth: 36, textAlign: "right" }}>
                {percentages[r]}%
              </span>
            </div>
          ))}
          {percentages.other > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, paddingTop: 6, borderTop: "1px solid #f0f0f0" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: ROLE_COLORS.other, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#aaa", minWidth: 72 }}>Other</span>
              <span style={{ fontSize: 12, color: "#aaa" }}>{percentages.other}% of all turns</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Speaker breakdown */}
    {speakers.length > 0 && (
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "22px", marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 16px" }}>BY SPEAKER</p>
        {speakers.map(s => <SpeakerBar key={s.name} speaker={s} />)}
        {/* Legend */}
        <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
          {roles.map(r => (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ROLE_COLORS[r] }} />
              <span style={{ fontSize: 11, color: "#999" }}>{ROLE_LABELS[r]}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Insights */}
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #eee", padding: "22px", marginBottom: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "0 0 16px" }}>COACHING INSIGHTS</p>
      {insights.map((insight, i) => (
        <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < insights.length - 1 ? 14 : 0 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#378add15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#378add" }}>{i + 1}</span>
          </div>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: 0 }}>{insight}</p>
        </div>
      ))}
    </div>

    {/* Reset */}
    <div style={{ borderTop: "1px solid #eee", paddingTop: 24 }}>
      <button onClick={onReset} style={{
        width: "100%", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
        cursor: "pointer", border: "1.5px solid #ddd", background: "#fff", color: "#555", fontFamily: FONT,
      }}>
        ↩ Analyze another transcript
      </button>
    </div>
  </>);
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Step = "upload" | "loading" | "results";

export default function ReadingTheRoomPage() {
  const [step, setStep] = useState<Step>("upload");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");

  async function handleAnalyze(file: File) {
    setFilename(file.name);
    setError("");
    setStep("loading");

    try {
      const ext = file.name.toLowerCase().split(".").pop() ?? "";
      const isPdf = ext === "pdf";
      const isDocx = ext === "docx";
      let content: string;

      if (isPdf) {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        content = btoa(binary);
      } else if (isDocx) {
        const buf = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        content = result.value;
      } else {
        content = await file.text();
      }

      const res = await fetch("/api/games/reading-the-room/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isPdf: isPdf && !isDocx, filename: file.name }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setAnalysis(data);
      setStep("results");
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setStep("upload");
    }
  }

  if (step === "loading") return <LoadingStep filename={filename} />;
  if (step === "results" && analysis) return <ResultsStep analysis={analysis} filename={filename} onReset={() => { setAnalysis(null); setStep("upload"); }} />;
  return (
    <>
      <UploadStep onAnalyze={handleAnalyze} />
      {error && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#d4537e", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}
    </>
  );
}
