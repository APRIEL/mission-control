"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "../../components/AppShell";

const STATUSES = ["pending", "approved", "rejected", "timeout"] as const;

function statusColor(status: string) {
  if (status === "approved") return "#22c55e";
  if (status === "rejected") return "#ef4444";
  if (status === "timeout") return "#f59e0b";
  return "#a78bfa";
}

export default function ApprovalsPage() {
  const approvals = useQuery(api.approvals.list) ?? [];
  const create = useMutation(api.approvals.create);
  const updateStatus = useMutation(api.approvals.updateStatus);
  const addActivity = useMutation(api.activities.add);

  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [timeoutId, setTimeoutId] = useState("");

  const summary = useMemo(() => ({
    pending: approvals.filter((a) => a.status === "pending").length,
    timeout: approvals.filter((a) => a.status === "timeout").length,
  }), [approvals]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await create({ title: title.trim(), source: source.trim() || undefined });
    await addActivity({ type: "approval", message: "承認リクエストを追加", detail: title.trim(), level: "info" });
    setTitle("");
    setSource("");
  };

  const addTimeoutApproval = async () => {
    const id = timeoutId.trim();
    if (!id) return;
    const t = `approval-timeout: ${id}`;
    await create({ title: t, source: "gateway", note: "再実行またはallowlist化を検討" });
    await addActivity({ type: "approval", message: "timeout案件を起票", detail: t, level: "warn" });
    setTimeoutId("");
  };

  return (
    <AppShell active="approvals" title="承認">
      <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 13 }}>
        <span style={{ color: "#a78bfa" }}>Pending {summary.pending}</span>
        <span style={{ color: "#f59e0b" }}>Timeout {summary.timeout}</span>
        <span style={{ opacity: 0.75 }}>Total {approvals.length}</span>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 220px 100px", gap: 8, marginBottom: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="承認タイトル（例: cron変更）" style={{ padding: 9, borderRadius: 8, border: "1px solid #334155", background: "#111827", color: "#e5e7eb" }} />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="元情報（任意）" style={{ padding: 9, borderRadius: 8, border: "1px solid #334155", background: "#111827", color: "#e5e7eb" }} />
        <button type="submit" style={{ borderRadius: 8, border: "1px solid #4f46e5", background: "#4338ca", color: "white" }}>追加</button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8, marginBottom: 12 }}>
        <input value={timeoutId} onChange={(e) => setTimeoutId(e.target.value)} placeholder="approval-timeout のID（例: ee32f...）" style={{ padding: 9, borderRadius: 8, border: "1px solid #7c2d12", background: "#111827", color: "#e5e7eb" }} />
        <button onClick={addTimeoutApproval} style={{ borderRadius: 8, border: "1px solid #f59e0b", background: "#78350f", color: "#fde68a" }}>timeout起票</button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {approvals.map((a) => (
          <article key={a._id} style={{ border: "1px solid #1f2937", borderRadius: 10, padding: 10, background: "#0f172a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: statusColor(a.status), display: "inline-block" }} />
              <strong>{a.title}</strong>
              <span style={{ marginLeft: "auto", fontSize: 12, color: statusColor(a.status), fontWeight: 700 }}>{a.status}</span>
            </div>
            {a.source && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>source: {a.source}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={async () => {
                    await updateStatus({ id: a._id, status: s });
                    await addActivity({ type: "approval", message: `承認ステータス更新: ${s}`, detail: a.title, level: s === "timeout" ? "warn" : "info" });
                  }}
                  style={{ fontSize: 12, padding: "4px 8px", borderRadius: 8, border: `1px solid ${statusColor(s)}`, background: "transparent", color: statusColor(s) }}
                >
                  {s}
                </button>
              ))}
              {a.status === "timeout" && (
                <button
                  onClick={async () => {
                    await updateStatus({ id: a._id, status: "pending", note: "再試行" });
                    await addActivity({ type: "approval", message: "timeout案件を再試行", detail: a.title, level: "warn" });
                  }}
                  style={{ fontSize: 12, padding: "4px 8px", borderRadius: 8, border: "1px solid #a78bfa", background: "#312e81", color: "#ddd6fe" }}
                >
                  pendingへ戻す（再試行）
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
