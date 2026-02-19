import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const WORKSPACE = "/home/ubuntu/.openclaw/workspace";
const MEMORY_DIR = path.join(WORKSPACE, "memory");
const ROOT_MEMORY = path.join(WORKSPACE, "MEMORY.md");

type Hit = { file: string; line: number; text: string };

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
    if (!q) return NextResponse.json({ ok: true, hits: [] });

    const targets: Array<{ file: string; full: string }> = [];

    try {
      await fs.access(ROOT_MEMORY);
      targets.push({ file: "MEMORY.md", full: ROOT_MEMORY });
    } catch {}

    try {
      const entries = await fs.readdir(MEMORY_DIR, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isFile() || !e.name.endsWith(".md")) continue;
        targets.push({ file: `memory/${e.name}`, full: path.join(MEMORY_DIR, e.name) });
      }
    } catch {}

    const hits: Hit[] = [];
    for (const t of targets) {
      const body = await fs.readFile(t.full, "utf-8");
      const lines = body.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(q)) {
          hits.push({ file: t.file, line: idx + 1, text: line.trim() });
        }
      });
    }

    return NextResponse.json({ ok: true, hits: hits.slice(0, 200) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
  }
}
