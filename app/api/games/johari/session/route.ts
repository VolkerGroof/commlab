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
    return NextResponse.json(createJohari(id, body.name));
  }

  if (action === "join") {
    const s = mutateJohari(body.id, sess => {
      if (!sess.participants.find(p => p.name === body.name))
        sess.participants.push({ name: body.name, done: false });
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "start-setup") {
    const s = mutateJohari(body.id, sess => { sess.phase = "setup"; });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "set-attributes") {
    const s = mutateJohari(body.id, sess => {
      sess.category   = body.category;
      sess.attributes = body.attributes;
      sess.phase      = "assessing";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "submit-selections") {
    // body.selections: { [rateeName]: string[] }
    const s = mutateJohari(body.id, sess => {
      sess.selections[body.rater] = body.selections;
      const p = sess.participants.find(p => p.name === body.rater);
      if (p) p.done = true;
      if (sess.participants.every(p => p.done)) sess.phase = "results";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
