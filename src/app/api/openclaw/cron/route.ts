import { execSync } from "node:child_process";
import { NextResponse } from "next/server";

function extractJson(raw: string) {
  const startArr = raw.indexOf("[");
  const startObj = raw.indexOf("{");
  const start =
    startArr === -1 ? startObj :
    startObj === -1 ? startArr :
    Math.min(startArr, startObj);

  if (start === -1) throw new Error("JSON開始位置を検出できません");

  const sliced = raw.slice(start).trim();
  return JSON.parse(sliced);
}

export async function GET() {
  try {
    const raw = execSync("openclaw --no-color cron list --json 2>/dev/null", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: "/bin/bash",
    });
    const parsed = extractJson(raw);
    const jobs = Array.isArray(parsed) ? parsed : (parsed.jobs ?? []);
    return NextResponse.json({ ok: true, jobs });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "failed to fetch cron list" },
      { status: 500 }
    );
  }
}
