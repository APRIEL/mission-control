"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppShell } from "../components/AppShell";

const COLUMNS = ["todo", "doing", "review", "done"] as const;
type Col = (typeof COLUMNS)[number];

function colLabel(c: Col) {
  if (c === "todo") return "バックログ";
  if (c === "doing") return "進行中";
  if (c === "review") return "レビュー";
  return "完了";
}

function colDot(c: Col) {
  if (c === "todo") return "#a78bfa";
  if (c === "doing") return "#60a5fa";
  if (c === "review") return "#fbbf24";
  return "#34d399";
}

export default function Home() {
  const tasks = useQuery(api.tasks.list) ?? [];
  const createTask = useMutation(api.tasks.create);
  const updateStatus = useMutation(api.tasks.updateStatus);

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState<"human" | "ai">("ai");
  const [filter, setFilter] = useState<"all" | "human" | "ai">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.assignee === filter);
  }, [tasks, filter]);

  const grouped = useMemo(() => {
    return COLUMNS.reduce((acc, c) => {
      acc[c] = filtered.filter((t) => t.status === c);
      return acc;
    }, {} as Record<Col, typeof filtered>);
  }, [filtered]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const doing = grouped.doing.length;
    const review = grouped.review.length;
    const done = grouped.done.length;
    const completion = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, doing, review, done, completion };
  }, [filtered, grouped]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask({ title: title.trim(), assignee });
    setTitle("");
  };

  const quickAdd = async (col: Col) => {
    const t = window.prompt(`${colLabel(col)} に追加するタスク名`, "");
    if (t === null || !t.trim()) return;
    const id = await createTask({ title: t.trim(), assignee });
    if (col !== "todo") await updateStatus({ id, status: col });
  };

  return (
    <AppShell active="tasks" title="タスク">
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16, fontSize: 28, fontWeight: 700 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, color: "#34d399" }}>
          <span>{stats.done}</span><span style={{ fontSize: 14, opacity: 0.7, color: "#e5e7eb" }}>完了</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, color: "#a78bfa" }}>
          <span>{stats.doing}</span><span style={{ fontSize: 14, opacity: 0.7, color: "#e5e7eb" }}>進行中</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, color: "#fbbf24" }}>
          <span>{stats.review}</span><span style={{ fontSize: 14, opacity: 0.7, color: "#e5e7eb" }}>レビュー</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span>{stats.total}</span><span style={{ fontSize: 14, opacity: 0.7 }}>総数</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, color: "#c4b5fd" }}>
          <span>{stats.completion}%</span><span style={{ fontSize: 14, opacity: 0.7, color: "#e5e7eb" }}>達成率</span>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button type="submit" style={{ padding: "8px 12px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8 }}>
          ＋ 新規タスク
        </button>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タスク名" style={{ flex: 1, minWidth: 220, padding: 8, borderRadius: 8, border: "1px solid #334155", background: "#111827", color: "#e5e7eb" }} />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value as "human" | "ai")} style={{ padding: 8, borderRadius: 8 }}>
          <option value="ai">AI担当</option>
          <option value="human">人間担当</option>
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "human" | "ai")} style={{ padding: 8, borderRadius: 8 }}>
          <option value="all">全担当</option>
          <option value="ai">AIのみ</option>
          <option value="human">人間のみ</option>
        </select>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
        {COLUMNS.map((c) => (
          <section key={c} style={{ border: "1px solid #1f2937", borderRadius: 12, minHeight: 460, background: "#0b111b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 10px 8px 10px", borderBottom: "1px solid #1f2937" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: colDot(c), display: "inline-block" }} />
                <strong>{colLabel(c)}</strong>
                <span style={{ opacity: 0.6 }}>{grouped[c].length}</span>
              </div>
              <button onClick={() => quickAdd(c)} style={{ border: "1px solid #334155", background: "transparent", color: "#cbd5e1", borderRadius: 6, padding: "0 6px", cursor: "pointer" }}>＋</button>
            </div>

            <div style={{ padding: 8, display: "grid", gap: 8 }}>
              {grouped[c].length === 0 ? (
                <div style={{ opacity: 0.45, textAlign: "center", padding: "30px 0" }}>タスクなし</div>
              ) : (
                grouped[c].map((t) => (
                  <article key={t._id} style={{ border: "1px solid #2b3443", borderRadius: 10, padding: 10, background: "#111827" }}>
                    <div style={{ fontWeight: 700 }}>{t.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>担当: {t.assignee === "ai" ? "AI" : "人間"}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {COLUMNS.map((s) => (
                        <button key={s} onClick={() => updateStatus({ id: t._id, status: s })} style={{ fontSize: 11, padding: "3px 6px", opacity: s === t.status ? 1 : 0.6 }}>
                          {colLabel(s)}
                        </button>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
