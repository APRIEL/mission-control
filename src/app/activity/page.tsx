"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "../../components/AppShell";

function levelColor(level: string) {
  if (level === "error") return "#ef4444";
  if (level === "warn") return "#f59e0b";
  return "#22c55e";
}

function levelLabel(level: string) {
  if (level === "error") return "ERROR";
  if (level === "warn") return "WARN";
  return "INFO";
}

export default function ActivityPage() {
  const activities = useQuery(api.activities.list, { limit: 200 }) ?? [];

  const grouped = useMemo(() => {
    const m = new Map<string, typeof activities>();
    for (const a of activities) {
      const day = new Date(a.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
      const list = m.get(day) ?? [];
      list.push(a);
      m.set(day, list);
    }
    return [...m.entries()];
  }, [activities]);

  return (
    <AppShell active="activity" title="アクティビティ">
      <div style={{ marginBottom: 12, fontSize: 13, opacity: 0.75 }}>Live Activity / 実行ログのタイムライン</div>
      <div style={{ border: "1px solid #1f2937", borderRadius: 12, overflow: "hidden", background: "#0b111b" }}>
        {grouped.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.6 }}>まだログがありません。</div>
        ) : (
          grouped.map(([day, logs]) => (
            <section key={day}>
              <div style={{ padding: "8px 12px", borderTop: "1px solid #1f2937", borderBottom: "1px solid #1f2937", background: "#0f172a", fontSize: 12, letterSpacing: 0.3, fontWeight: 700 }}>
                {day} ({logs.length})
              </div>
              <div style={{ display: "grid" }}>
                {logs.map((a) => (
                  <article key={a._id} style={{ padding: "10px 12px", borderBottom: "1px solid #111827" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: levelColor(a.level), display: "inline-block" }} />
                      <span style={{ fontSize: 11, color: levelColor(a.level), fontWeight: 700 }}>{levelLabel(a.level)}</span>
                      <strong style={{ fontSize: 14 }}>{a.message}</strong>
                      <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.65 }}>
                        {new Date(a.createdAt).toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" })}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>{a.type}</div>
                    {a.detail && <div style={{ marginTop: 2, fontSize: 13, opacity: 0.9 }}>{a.detail}</div>}
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
