"use client";

import Link from "next/link";
import { useState } from "react";


const games = [
  {
    id: "communication-square",
    number: "01",
    title: "The Communication Square",
    description: "Decode what was really said — and what was really heard. Four dimensions, one message.",
    color: "#7c6fcd",
    available: true,
  },
  {
    id: "inner-team",
    number: "02",
    title: "The Inner Team",
    description: "Surface the conflicting voices before a hard decision. Let your inner cast speak.",
    color: "#1d9e75",
    available: true,
  },
  {
    id: "value-square",
    number: "03",
    title: "The Value Square",
    description: "Every strength has a shadow. Find the healthy balance between your values.",
    color: "#e07a3a",
    available: true,
  },
  {
    id: "vicious-circle",
    number: "04",
    title: "The Vicious Circle",
    description: "Name the loop you're stuck in. Make the self-reinforcing pattern visible — then step out.",
    color: "#d4537e",
    available: true,
  },
  {
    id: "reading-the-room",
    number: "05",
    title: "Reading the Room",
    description: "Upload a meeting transcript and reveal the hidden role dynamics — Mover, Follower, Opposer, Bystander.",
    color: "#378add",
    available: true,
  },
  {
    id: "communication-styles",
    number: "06",
    title: "8 Communication Styles",
    description: "Describe a conflict or high-stake situation — and find out which of the 8 styles runs your reactions without you noticing.",
    color: "#639922",
    available: true,
  },
  {
    id: "johari",
    number: "07",
    title: "Johari Window",
    description: "A shared team assessment — discover what you know about yourself and what others see that you don't.",
    color: "#e67e22",
    available: true,
  },
  {
    id: "nonviolent-communication",
    number: "08",
    title: "Nonviolent Communication",
    description: "Prepare a difficult message with honesty and empathy — 4 steps to say what you mean without blame.",
    color: "#16a085",
    available: true,
  },
  {
    id: "meeting-prep",
    number: "09",
    title: "Meeting Preparation",
    description: "Map the 4 dimensions of any meeting — background, topic, dynamics, and goal — alone or with your team.",
    color: "#c0392b",
    available: true,
  },
  {
    id: "fierce-conversation",
    number: "10",
    title: "Fierce Conversation",
    description: "Prepare the conversation you've been putting off. 7 steps. 60 seconds.",
    color: "#8e44ad",
    available: true,
  },
];

const bullets = [
  { color: "#7c6fcd", text: "Get surprising insights" },
  { color: "#1d9e75", text: "Unlock team genius" },
  { color: "#e07a3a", text: "Break through blocks" },
  { color: "#d4537e", text: "Co-create like a pro" },
  { color: "#378add", text: "Build togetherness" },
  { color: "#639922", text: "Maximize clarity" },
];

type Game = (typeof games)[0];

export default function HomePage() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredIds, setFilteredIds] = useState<string[] | null>(null);

  const visibleGames = filteredIds
    ? games.filter((g) => filteredIds.includes(g.id))
    : games;

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setFilteredIds(data.ids ?? null);
    } catch {
      setFilteredIds(null);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setQuery("");
    setFilteredIds(null);
  }

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: "relative",
      background: "linear-gradient(-45deg, #1a1040, #2d1b5e, #0f3d2e, #1a2f5e, #3d1540, #0d3d35, #1f1060)",
      backgroundSize: "400% 400%",
      animation: "aurora 18s ease infinite",
    }}>
    <style>{`
      @keyframes aurora { 0%{background-position:0% 50%} 25%{background-position:50% 0%} 50%{background-position:100% 50%} 75%{background-position:50% 100%} 100%{background-position:0% 50%} }
      @media (max-width: 640px) {
        .cl-top-note { display: none !important; }
        .cl-hero { padding: 56px 20px 36px !important; }
        .cl-title { font-size: 34px !important; letter-spacing: -1px !important; white-space: normal !important; line-height: 1.15 !important; }
        .cl-bullets { grid-template-columns: 1fr !important; gap: 8px 0 !important; text-align: left; margin: 0 auto; }
        .cl-game-grid { grid-template-columns: 1fr !important; padding: 8px 16px 80px !important; max-width: 100% !important; }
        .cl-search { padding: 0 20px !important; }
      }
    `}</style>

      {/* Top right note */}
      <div className="cl-top-note" style={{ position: "absolute", top: 24, right: 36 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>No sign-up. No data stored.</span>
      </div>

      {/* Hero */}
      <section className="cl-hero" style={{ padding: "88px 40px 52px", textAlign: "center" }}>
        <h1 className="cl-title" style={{
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.0,
          letterSpacing: "-2.5px",
          color: "#ffffff",
          margin: "0 0 32px",
          whiteSpace: "nowrap",
        }}>
          Unbox Communication.
        </h1>

        <div className="cl-bullets" style={{ display: "inline-grid", gridTemplateColumns: "1fr 1fr", gap: "12px 48px", marginBottom: 40 }}>
          {bullets.map((b) => (
            <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Search box */}
        <div className="cl-search" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            border: "1.5px solid rgba(0,0,0,0.09)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            padding: "4px 12px 4px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <textarea
              value={query}
              rows={2}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) handleReset();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Pick a game — or describe your situation and we'll find the right tool for you."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#333",
                background: "transparent",
                padding: "12px 0",
                minWidth: 0,
                resize: "none",
                lineHeight: 1.5,
                fontFamily: "inherit",
              }}
            />
            {query && (
              <button
                onClick={handleSearch}
                disabled={loading}
                style={{
                  flexShrink: 0,
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {loading ? "Searching…" : "Find tools →"}
              </button>
            )}
          </div>
          {filteredIds && (
            <button
              onClick={handleReset}
              style={{ marginTop: 12, background: "none", border: "none", fontSize: 12, color: "#999", cursor: "pointer", textDecoration: "underline" }}
            >
              Show all tools
            </button>
          )}
        </div>
      </section>

      {/* Game grid */}
      <section className="cl-game-grid" style={{
        maxWidth: filteredIds ? 720 : 1040,
        margin: "0 auto",
        padding: "8px 40px 100px",
        display: "grid",
        gridTemplateColumns: filteredIds
          ? `repeat(${Math.min(visibleGames.length, 2)}, minmax(0, 1fr))`
          : "repeat(3, minmax(0, 1fr))",
        gridAutoRows: "1fr",
        gap: 16,
        transition: "max-width 0.3s ease",
      }}>
        {visibleGames.map((game) =>
          game.available ? (
            <AvailableCard
              key={game.id}
              game={game}
              hovered={hovered === game.id}
              onMouseEnter={() => setHovered(game.id)}
              onMouseLeave={() => setHovered(null)}
            />
          ) : (
            <SoonCard key={game.id} game={game} />
          )
        )}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.15)", padding: "20px 40px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Session data deleted when you leave.</span>
      </footer>
    </div>
  );
}

function AvailableCard({ game, hovered, onMouseEnter, onMouseLeave }: {
  game: Game;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <Link
      href={`/games/${game.id}`}
      style={{ textDecoration: "none", display: "flex" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderRadius: 20,
        overflow: "hidden",
        background: "#ffffff",
        border: hovered ? `1.5px solid ${game.color}` : "1.5px solid rgba(0,0,0,0.08)",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? `0 12px 32px ${game.color}28` : "0 2px 8px rgba(0,0,0,0.04)",
        cursor: "pointer",
      }}>
        <div style={{ background: game.color, padding: "28px 24px 24px", flexShrink: 0 }}>
          <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", marginBottom: 10 }}>{game.number}</span>
          <p style={{ fontSize: 17, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.2, letterSpacing: "-0.4px" }}>{game.title}</p>
        </div>
        <div style={{ background: "#fff", padding: "20px 24px 24px", flex: 1, display: "flex", alignItems: "flex-start" }}>
          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.65, margin: 0 }}>{game.description}</p>
        </div>
      </div>
    </Link>
  );
}

function SoonCard({ game }: { game: Game }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      borderRadius: 20,
      overflow: "hidden",
      background: "#ffffff",
      border: "1.5px solid rgba(0,0,0,0.08)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ background: game.color, padding: "28px 24px 24px", flexShrink: 0, opacity: 0.38 }}>
        <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", marginBottom: 10 }}>{game.number}</span>
        <p style={{ fontSize: 17, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.2, letterSpacing: "-0.4px" }}>{game.title}</p>
      </div>
      <div style={{ background: "#fff", padding: "20px 24px 24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.65, margin: "0 0 16px" }}>{game.description}</p>
        <span style={{ fontSize: 11, fontWeight: 500, color: "#aaa", letterSpacing: "0.04em" }}>Coming soon</span>
      </div>
    </div>
  );
}
