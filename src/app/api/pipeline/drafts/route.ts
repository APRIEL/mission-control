import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

type DraftItem = {
  title: string;
  platform: "tiktok" | "2xko" | "other";
  stage: "draft";
  memo?: string;
  sourcePath: string;
};

const DRAFT_DIR = "/home/ubuntu/.openclaw/workspace/content-drafts";

function detectPlatform(name: string): "tiktok" | "2xko" | "other" {
  const n = name.toLowerCase();
  if (n.includes("tiktok")) return "tiktok";
  if (n.includes("2xko")) return "2xko";
  return "other";
}

function buildTitle(name: string, platform: "tiktok" | "2xko" | "other"): string {
  if (platform === "tiktok") return `TikTok下書き: ${name}`;
  if (platform === "2xko") return `2XKO記事下書き: ${name}`;
  return `下書き: ${name}`;
}

export async function GET() {
  try {
    const entries = await fs.readdir(DRAFT_DIR, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.endsWith(".txt"))
      .map((e) => e.name)
      .sort((a, b) => b.localeCompare(a));

    const items: DraftItem[] = [];

    for (const file of files.slice(0, 50)) {
      const full = path.join(DRAFT_DIR, file);
      const platform = detectPlatform(file);
      const content = await fs.readFile(full, "utf-8");
      const firstLine = content.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim();

      items.push({
        title: buildTitle(file, platform),
        platform,
        stage: "draft",
        memo: firstLine ? `冒頭: ${firstLine.slice(0, 120)}` : undefined,
        sourcePath: full,
      });
    }

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "failed to scan drafts" },
      { status: 500 }
    );
  }
}
