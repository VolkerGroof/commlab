import { NextRequest, NextResponse } from "next/server";
import { getTetralemma, createTetralemma, mutateTetralemma } from "@/lib/tetralemmaStore";

function randomId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const s = await getTetralemma(id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(s);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const id = randomId();
    return NextResponse.json(await createTetralemma(id, body.hostName, body.challenge));
  }

  if (action === "join") {
    const s = await mutateTetralemma(body.id, sess => {
      if (!sess.guestName) sess.guestName = body.guestName;
      if (sess.phase === "lobby") sess.phase = "enter-ideas";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "set-idea") {
    const s = await mutateTetralemma(body.id, sess => {
      if (body.role === "host")  sess.ideaA = body.idea;
      if (body.role === "guest") sess.ideaB = body.idea;
      if (sess.ideaA && sess.ideaB && sess.phase === "enter-ideas") sess.phase = "flip";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "flip") {
    const s = await mutateTetralemma(body.id, sess => {
      sess.currentSide    = body.side;
      sess.currentContext = body.context;
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "advance") {
    const s = await mutateTetralemma(body.id, sess => { sess.phase = body.phase; });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "add-context") {
    const s = await mutateTetralemma(body.id, sess => {
      const arr = body.position === "both" ? sess.bothContexts : sess.neitherContexts;
      if (arr.length < 3) arr.push(body.context);
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "set-solution") {
    const s = await mutateTetralemma(body.id, sess => {
      sess.solution = body.solution;
      sess.phase    = "done";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
