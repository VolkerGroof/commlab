import { NextRequest, NextResponse } from "next/server";
import { getCulture, createCulture, mutateCulture } from "@/lib/cultureStore";
import type { CultureAgreement } from "@/lib/cultureStore";

function randomId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
function avgScore(answers: number[]) {
  return Math.round(answers.reduce((a, b) => a + b, 0) / answers.length);
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const s = await getCulture(id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(s);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const id = randomId();
    return NextResponse.json(await createCulture(id, body.hostName));
  }

  if (action === "join") {
    const s = await mutateCulture(body.id, sess => {
      if (!sess.participants.includes(body.name)) sess.participants.push(body.name);
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "start") {
    const s = await mutateCulture(body.id, sess => { sess.phase = "running"; });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "submit-scores") {
    const s = await mutateCulture(body.id, sess => {
      sess.scores[body.name] = body.answers;
      // When all have scored → go to discussing
      if (sess.participants.every(p => sess.scores[p])) {
        sess.dimPhase = "discussing";
        // Save avg scores
        sess.participants.forEach(p => {
          if (!sess.allScores[p]) sess.allScores[p] = [];
          const dimIdx = sess.currentDim;
          sess.allScores[p][dimIdx] = avgScore(sess.scores[p]);
        });
      }
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "add-agreement") {
    const s = await mutateCulture(body.id, sess => {
      sess.agreements.push({ id: String(Date.now()), text: body.text, approvals: [] });
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "set-agreements") {
    const s = await mutateCulture(body.id, sess => {
      sess.agreements = (body.agreements as string[]).map((text, i) => ({
        id: String(i), text, approvals: [],
      }));
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "edit-agreement") {
    const s = await mutateCulture(body.id, sess => {
      const ag = sess.agreements.find(a => a.id === body.agId);
      if (ag) { ag.text = body.text; ag.approvals = []; } // reset approvals on edit
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "approve-agreement") {
    const s = await mutateCulture(body.id, sess => {
      const ag = sess.agreements.find(a => a.id === body.agId);
      if (ag && !ag.approvals.includes(body.name)) ag.approvals.push(body.name);
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "advance-dimension") {
    const s = await mutateCulture(body.id, sess => {
      // Save agreements for this dimension
      sess.allAgreements[sess.currentDim] = sess.agreements.map(a => a.text);
      sess.currentDim += 1;
      sess.dimPhase = "scoring";
      sess.scores = {};
      sess.agreements = [];
      sess.dimReadyToAdvance = [];
      if (sess.currentDim >= 8) sess.phase = "done";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
