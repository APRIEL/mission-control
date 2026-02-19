"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "../../components/AppShell";

const STATUSES = ["pending", "approved", "rejected", "timeout"] as const;

export default function ApprovalsPage() {
  const approvals = useQuery(api.approvals.list) ?? [];
  const create = useMutation(api.approvals.create);
  const updateStatus = useMutation(api.approvals.updateStatus);
  const addActivity = useMutation(api.activities.add);

  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await create({ title: title.trim(), source: source.trim() || undefined });
    await addActivity({ type: "approval", message: "承認リクエストを追加", detail: title.trim(), level: "info" });
    setTitle("");
    setSource("");
  };

  return (
    <AppShell active="approvals" title="承認キュー">
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="承認タイトル（例: cron変更）" style={{ flex: 1, minWidth: 200, padding: 8 }} />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="元情報（任意）" style={{ minWidth: 180, padding: 8 }} />
        <button type="submit" style={{ padding: "8px 12px" }}>追加</button>
      </form>

      <div style={{ display: "grid", gap: 8 }}>
        {approvals.map((a) => (
          <article key={a._id} style={{ border: "1px solid #334155", borderRadius: 10, padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong>{a.title}</strong>
              <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>{a.status}</span>
            </div>
            {a.source && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>source: {a.source}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={async () => {
                    await updateStatus({ id: a._id, status: s });
                    await addActivity({ type: "approval", message: `承認ステータス更新: ${s}`, detail: a.title, level: s === "timeout" ? "warn" : "info" });
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
