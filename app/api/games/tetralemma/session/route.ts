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

  if (action === "toggle-ready") {
    const s = await mutateTetralemma(body.id, sess => {
      if (body.role === "host")  sess.readyHost  = !sess.readyHost;
      if (body.role === "guest") sess.readyGuest = !sess.readyGuest;
      // Auto-advance when both ready
      if (sess.readyHost && sess.readyGuest) {
        sess.phase      = body.nextPhase;
        sess.readyHost  = false;
        sess.readyGuest = false;
      }
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "advance") {
    const s = await mutateTetralemma(body.id, sess => {
      sess.phase = body.phase;
      sess.readyHost = false; sess.readyGuest = false;
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "flip-reshuffle-role") {
    const s = await mutateTetralemma(body.id, sess => {
      const field = body.position === "both" ? "bothReshuffleRole" : "neitherReshuffleRole";
      sess[field] = sess[field] === "host" ? "guest" : "host";
    });
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
      if (body.role === "host")  sess.solutionHost  = body.solution;
      if (body.role === "guest") sess.solutionGuest = body.solution;
      if (!body.role) sess.solution = body.solution; // solo
      // Done when solo, or both pair solutions submitted
      const pairDone = sess.solutionHost && sess.solutionGuest;
      const soloDone = !body.role && body.solution;
      if (pairDone || soloDone) sess.phase = "done";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
