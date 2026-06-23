import { getUpstashStatus, createJohari, getJohari } from "@/lib/johariStore";

export async function GET() {
  const status = getUpstashStatus();
  let redisWorking = false;
  let error = "";

  try {
    await createJohari("__test__", "test");
    const s = await getJohari("__test__");
    redisWorking = !!s;
  } catch (e) {
    error = String(e);
  }

  return Response.json({ status, redisWorking, error });
}
