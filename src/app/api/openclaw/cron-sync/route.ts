import { execSync } from "node:child_process";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-sync-token");
    if (!process.env.CRON_SYNC_TOKEN || token !== process.env.CRON_SYNC_TOKEN) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const raw = execSync("openclaw --no-color cron list --json 2>/dev/null", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: "/bin/bash",
    });
    const parsed = extractJson(raw);
    const jobs = Array.isArray(parsed) ? parsed : (parsed.jobs ?? []);

    // ここでは「取得成功ログ」だけ返す（DB反映は画面側でも実施済み）
    // 次段でConvex HTTP Actionに直接upsertする形へ拡張可
    return NextResponse.json({ ok: true, count: jobs.length, jobs });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "sync failed" }, { status: 500 });
  }
}
