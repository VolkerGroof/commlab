import { NextRequest, NextResponse } from "next/server";
import { getCircleSession, createCircleSession, submitCircle } from "@/lib/circleStore";

function randomId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const s = getCircleSession(id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(s);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const id = randomId();
    const s = createCircleSession(id, body.name1, body.name2);
    return NextResponse.json(s);
  }

  if (action === "submit") {
    const s = submitCircle(body.id, body.player, body.data);
    if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(s);
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
