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

export default function ActivityPage() {
  const activities = useQuery(api.activities.list, { limit: 150 }) ?? [];

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
      <div style={{ opacity: 0.75, marginBottom: 12 }}>OpenClawの実行履歴・更新履歴を時系列で表示します。</div>
      {grouped.length === 0 ? (
        <div style={{ opacity: 0.7 }}>まだログがありません。</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {grouped.map(([day, logs]) => (
            <section key={day} style={{ border: "1px solid #1f2937", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 10px", borderBottom: "1px solid #1f2937", background: "#0f172a", fontWeight: 700 }}>{day}</div>
              <div style={{ display: "grid" }}>
                {logs.map((a) => (
                  <article key={a._id} style={{ padding: 10, borderTop: "1px solid #111827" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: levelColor(a.level), display: "inline-block" }} />
                      <strong>{a.message}</strong>
                      <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
                        {new Date(a.createdAt).toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" })}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{a.type}</div>
                    {a.detail && <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{a.detail}</div>}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
