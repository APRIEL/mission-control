"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const tasks = useQuery(api.tasks.list) ?? [];
  const createTask = useMutation(api.tasks.create);
  const updateStatus = useMutation(api.tasks.updateStatus);

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState<"human" | "ai">("ai");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask({ title: title.trim(), assignee });
    setTitle("");
  };

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <strong>Tasks</strong>
        <Link href="/calendar">Calendar</Link>
        <Link href="/pipeline">Pipeline</Link>
        <Link href="/memory">Memory</Link>
        <Link href="/team">Team</Link>
        <Link href="/office">Office</Link>
      </div>

      <h1>Mission Control - Tasks</h1>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タスク名"
          style={{ flex: 1, padding: 8 }}
        />
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value as "human" | "ai")}
          style={{ padding: 8 }}
        >
          <option value="ai">AI</option>
          <option value="human">Human</option>
        </select>
        <button type="submit" style={{ padding: "8px 12px" }}>追加</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
        {tasks.map((t) => (
          <li key={t._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div><strong>{t.title}</strong></div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              担当: {t.assignee} / 状態: {t.status}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              {(["todo", "doing", "done"] as const).map((s) => (
                <button key={s} onClick={() => updateStatus({ id: t._id, status: s })}>
                  {s}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
