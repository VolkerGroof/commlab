import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as File;
  if (!audio) return Response.json({ error: "no audio" }, { status: 400 });

  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model: "whisper-1",
  });

  return Response.json({ text: transcription.text });
}
