import { NextRequest, NextResponse } from "next/server";
import { getJohari, createJohari, mutateJohari } from "@/lib/johariStore";

function randomId() {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const s = getJohari(id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(s);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const id = randomId();
    const s = createJohari(id, body.name);
    return NextResponse.json(s);
  }

  if (action === "join") {
    const s = mutateJohari(body.id, sess => {
      if (!sess.participants.find(p => p.name === body.name)) {
        sess.participants.push({ name: body.name, done: false });
      }
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "start-setup") {
    const s = mutateJohari(body.id, sess => { sess.phase = "setup"; });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "set-questions") {
    const s = mutateJohari(body.id, sess => {
      sess.category = body.category;
      sess.questions = body.questions;
      sess.phase = "assessing";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "submit-ratings") {
    // body.ratings: { [rateeName]: boolean[] } — one array of 5 booleans per ratee
    const s = mutateJohari(body.id, sess => {
      sess.ratings[body.rater] = body.ratings;
      const participant = sess.participants.find(p => p.name === body.rater);
      if (participant) participant.done = true;
      // Check if everyone is done → move to results
      if (sess.participants.every(p => p.done)) sess.phase = "results";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
