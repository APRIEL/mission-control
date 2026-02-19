import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const WORKSPACE = "/home/ubuntu/.openclaw/workspace";

export async function GET(req: NextRequest) {
  try {
    const file = req.nextUrl.searchParams.get("file");
    if (!file) {
      return NextResponse.json({ ok: false, error: "file required" }, { status: 400 });
    }

    const normalized = path.normalize(file).replace(/^\/+/, "");
    if (normalized.includes("..")) {
      return NextResponse.json({ ok: false, error: "invalid path" }, { status: 400 });
    }

    if (!(normalized === "MEMORY.md" || normalized.startsWith("memory/"))) {
      return NextResponse.json({ ok: false, error: "not allowed" }, { status: 403 });
    }

    const full = path.join(WORKSPACE, normalized);
    const content = await fs.readFile(full, "utf-8");
    return NextResponse.json({ ok: true, file: normalized, content });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
  }
}
