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
  return JSON.parse(raw.slice(start).trim());
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

    const normalized = jobs.map((j: any) => ({
      name: j.name ?? "(no-name)",
      schedule:
        j.schedule?.kind === "cron"
          ? `${j.schedule.expr} (${j.schedule.tz ?? "UTC"})`
          : JSON.stringify(j.schedule),
      enabled: !!j.enabled,
      nextRunAtMs: j.state?.nextRunAtMs ?? null,
      source: "openclaw-cron",
    }));
    return NextResponse.json({ ok: true, jobs: normalized });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "failed to fetch cron list" },
      { status: 500 }
    );
  }
}
