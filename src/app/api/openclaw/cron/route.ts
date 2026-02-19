import { execSync } from "node:child_process";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const raw = execSync("openclaw cron list --json", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    const parsed = JSON.parse(raw);
    const jobs = Array.isArray(parsed) ? parsed : (parsed.jobs ?? []);

    return NextResponse.json({ ok: true, jobs });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "failed to fetch cron list" },
      { status: 500 }
    );
  }
}
