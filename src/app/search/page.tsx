"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "../../components/AppShell";

type Hit = { area: string; title: string; sub?: string };

export default function GlobalSearchPage() {
  const [q, setQ] = useState("");

  const tasks = useQuery(api.tasks.list) ?? [];
  const contents = useQuery(api.contents.list) ?? [];
  const events = useQuery(api.events.list) ?? [];
  const team = useQuery(api.team.list) ?? [];

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [] as Hit[];
    const out: Hit[] = [];

    for (const t of tasks) {
      const text = `${t.title} ${t.assignee} ${t.status}`.toLowerCase();
      if (text.includes(s)) out.push({ area: "タスク", title: t.title, sub: `${t.assignee} / ${t.status}` });
    }
    for (const c of contents) {
      const text = `${c.title} ${c.platform} ${c.stage} ${c.memo ?? ""}`.toLowerCase();
      if (text.includes(s)) out.push({ area: "パイプライン", title: c.title, sub: `${c.platform} / ${c.stage}` });
    }
    for (const e of events) {
      const text = `${e.title} ${e.schedule} ${e.source}`.toLowerCase();
      if (text.includes(s)) out.push({ area: "カレンダー", title: e.title, sub: e.schedule });
    }
    for (const m of team) {
      const text = `${m.name} ${m.role} ${m.focus ?? ""} ${m.ownsKeywords ?? ""}`.toLowerCase();
      if (text.includes(s)) out.push({ area: "チーム", title: m.name, sub: `${m.role}` });
    }

    return out.slice(0, 200);
  }, [q, tasks, contents, events, team]);

  return (
    <AppShell active="search" title="グローバル検索">
      <div style={{ marginBottom: 12, opacity: 0.8 }}>タスク / パイプライン / カレンダー / チームを横断検索します。</div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="キーワードを入力（例: TikTok / 2XKO / 管理者）"
        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#111827", color: "#e5e7eb", marginBottom: 12 }}
      />

      {q.trim() && <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.8 }}>{hits.length} 件ヒット</div>}
      <div style={{ display: "grid", gap: 8 }}>
        {hits.map((h, i) => (
          <article key={`${h.area}-${h.title}-${i}`} style={{ border: "1px solid #334155", borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{h.area}</div>
            <div style={{ fontWeight: 700 }}>{h.title}</div>
            {h.sub && <div style={{ fontSize: 12, opacity: 0.8 }}>{h.sub}</div>}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
