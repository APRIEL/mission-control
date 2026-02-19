import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const WORKSPACE = "/home/ubuntu/.openclaw/workspace";
const MEMORY_DIR = path.join(WORKSPACE, "memory");
const ROOT_MEMORY = path.join(WORKSPACE, "MEMORY.md");

export async function GET() {
  try {
    const files: string[] = [];

    try {
      await fs.access(ROOT_MEMORY);
      files.push("MEMORY.md");
    } catch {}

    try {
      const entries = await fs.readdir(MEMORY_DIR, { withFileTypes: true });
      const md = entries
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .map((e) => `memory/${e.name}`)
        .sort((a, b) => b.localeCompare(a));
      files.push(...md);
    } catch {}

    return NextResponse.json({ ok: true, files });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
  }
}
