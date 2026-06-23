import { NextRequest, NextResponse } from "next/server";
import { getMeeting, createMeeting, mutateMeeting } from "@/lib/meetingPrepStore";
import type { MeetingEntry } from "@/lib/meetingPrepStore";

function randomId() { return Math.random().toString(36).slice(2, 9).toUpperCase(); }

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const s = await getMeeting(id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(s);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const id = randomId();
    return NextResponse.json(await createMeeting(id, body.hostName, body.title));
  }

  if (action === "join") {
    const s = await mutateMeeting(body.id, sess => {
      if (!sess.participants.find(p => p.name === body.name))
        sess.participants.push({ name: body.name, done: false });
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "start-filling") {
    const s = await mutateMeeting(body.id, sess => { sess.phase = "filling"; });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "submit-entry") {
    const entry: MeetingEntry = body.entry;
    const s = await mutateMeeting(body.id, sess => {
      sess.entries[body.name] = entry;
      const p = sess.participants.find(p => p.name === body.name);
      if (p) p.done = true;
      if (sess.participants.every(p => p.done)) sess.phase = "consolidating";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "update-consolidation") {
    // host updates a consolidation field
    const s = await mutateMeeting(body.id, sess => {
      const key = body.field as keyof typeof sess.consolidation;
      if (key in sess.consolidation) (sess.consolidation as unknown as Record<string, unknown>)[key] = body.value;
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "advance-consolidation") {
    const s = await mutateMeeting(body.id, sess => {
      sess.consolidation.currentDimension = Math.min(4, sess.consolidation.currentDimension + 1);
      if (sess.consolidation.currentDimension >= 4) sess.phase = "results";
    });
    return s ? NextResponse.json(s) : NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
