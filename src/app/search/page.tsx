"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "../../components/AppShell";

type Hit = { area: string; title: string; sub?: string; href?: string };
type MemoryHit = { file: string; line: number; text: string };

const areaColor: Record<string, string> = {
  タスク: "#22c55e",
  パイプライン: "#a78bfa",
  カレンダー: "#f59e0b",
  チーム: "#06b6d4",
};

export default function GlobalSearchPage() {
  const [q, setQ] = useState("");
  const [memoryHits, setMemoryHits] = useState<MemoryHit[]>([]);

  const tasks = useQuery(api.tasks.list) ?? [];
  const contents = useQuery(api.contents.list) ?? [];
  const events = useQuery(api.events.list) ?? [];
  const team = useQuery(api.team.list) ?? [];

  useEffect(() => {
    const s = q.trim();
    if (!s) {
      setMemoryHits([]);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/memory/search?q=${encodeURIComponent(s)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!data?.ok) return setMemoryHits([]);
        setMemoryHits((data.hits ?? []).slice(0, 50));
      } catch {
        if (!cancelled) setMemoryHits([]);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [] as Hit[];
    const out: Hit[] = [];

    for (const t of tasks) {
      const text = `${t.title} ${t.assignee} ${t.status}`.toLowerCase();
      if (text.includes(s)) out.push({ area: "タスク", title: t.title, sub: `${t.assignee} / ${t.status}`, href: "/" });
    }
    for (const c of contents) {
      const text = `${c.title} ${c.platform} ${c.stage} ${c.memo ?? ""}`.toLowerCase();
      if (text.includes(s)) out.push({ area: "パイプライン", title: c.title, sub: `${c.platform} / ${c.stage}`, href: "/pipeline" });
    }
    for (const e of events) {
      const text = `${e.title} ${e.schedule} ${e.source}`.toLowerCase();
      if (text.includes(s)) out.push({ area: "カレンダー", title: e.title, sub: e.schedule, href: "/calendar" });
    }
    for (const m of team) {
      const text = `${m.name} ${m.role} ${m.focus ?? ""} ${m.ownsKeywords ?? ""}`.toLowerCase();
      if (text.includes(s)) out.push({ area: "チーム", title: m.name, sub: `${m.role}`, href: "/team" });
    }

    return out.slice(0, 250);
  }, [q, tasks, contents, events, team]);

  return (
    <AppShell active="search" title="検索">
      <div style={{ marginBottom: 10, opacity: 0.75, fontSize: 13 }}>Global Search / 横断検索</div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="キーワードを入力（例: TikTok / 2XKO / 管理者）"
        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#111827", color: "#e5e7eb", marginBottom: 12 }}
      />

      {q.trim() && <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.8 }}>{hits.length + memoryHits.length} 件ヒット（DB {hits.length} / Memory {memoryHits.length}）</div>}
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {hits.map((h, i) => (
          <article key={`${h.area}-${h.title}-${i}`} style={{ border: "1px solid #1f2937", borderRadius: 8, padding: 10, background: "#0f172a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: areaColor[h.area] ?? "#94a3b8", display: "inline-block" }} />
              <div style={{ fontSize: 12, color: areaColor[h.area] ?? "#94a3b8", fontWeight: 700 }}>{h.area}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 700 }}>{h.title}</div>
              {h.href && (
                <Link href={h.href} style={{ marginLeft: "auto", fontSize: 12, color: "#93c5fd" }}>
                  開く →
                </Link>
              )}
            </div>
            {h.sub && <div style={{ fontSize: 12, opacity: 0.8 }}>{h.sub}</div>}
          </article>
        ))}
      </div>

      {memoryHits.length > 0 && (
        <section style={{ border: "1px solid #334155", borderRadius: 10, padding: 10, background: "#0b111b" }}>
          <div style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 700, marginBottom: 8 }}>MEMORY</div>
          <div style={{ display: "grid", gap: 8 }}>
            {memoryHits.map((m, i) => (
              <article key={`${m.file}-${m.line}-${i}`} style={{ border: "1px solid #1f2937", borderRadius: 8, padding: 8, background: "#0f172a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{m.file}#{m.line}</div>
                  <Link href={`/memory?file=${encodeURIComponent(m.file)}`} style={{ marginLeft: "auto", fontSize: 12, color: "#c4b5fd" }}>
                    メモリーで開く →
                  </Link>
                </div>
                <div style={{ fontSize: 13 }}>{m.text || "(空行)"}</div>
              </article>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
