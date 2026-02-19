"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type CronJob = {
  name: string;
  schedule: string;
  enabled: boolean;
  nextRunAtMs?: number | null;
};

function statusColor(status: string) {
  if (status === "working") return "#d1fae5";
  if (status === "blocked") return "#fee2e2";
  if (status === "idle") return "#fef3c7";
  return "#e5e7eb";
}

function fmt(ms?: number | null) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default function OfficePage() {
  const members = useQuery(api.team.list) ?? [];
  const [jobs, setJobs] = useState<CronJob[]>([]);

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/openclaw/cron");
      const data = await res.json();
      if (!data?.ok) return;
      setJobs((data.jobs ?? []) as CronJob[]);
    };
    run();
  }, []);

  const summary = useMemo(() => {
    return {
      total: members.length,
      working: members.filter((m) => m.status === "working").length,
      blocked: members.filter((m) => m.status === "blocked").length,
      idle: members.filter((m) => m.status === "idle").length,
      offline: members.filter((m) => m.status === "offline").length,
    };
  }, [members]);

  const assignments = useMemo(() => {
    return jobs.map((j) => {
      const lower = (j.name || "").toLowerCase();
      const owner = members.find((m) => {
        const keys = (m.ownsKeywords || "")
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);
        return keys.some((k) => lower.includes(k));
      });
      return { ...j, owner: owner?.name ?? "未割当", ownerStatus: owner?.status ?? "-" };
    });
  }, [jobs, members]);

  return (
    <main style={{ maxWidth: 1100, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link href="/">Tasks</Link>
        <Link href="/calendar">Calendar</Link>
        <Link href="/pipeline">Pipeline</Link>
        <Link href="/memory">Memory</Link>
        <Link href="/team">Team</Link>
        <strong>Office</strong>
      </div>

      <h1>Mission Control - Office</h1>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <strong>稼働サマリー</strong>
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          <span>合計: {summary.total}</span>
          <span>working: {summary.working}</span>
          <span>blocked: {summary.blocked}</span>
          <span>idle: {summary.idle}</span>
          <span>offline: {summary.offline}</span>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <strong>ジョブ担当マップ（cron）</strong>
        <ul style={{ margin: "8px 0 0 0", paddingLeft: 18, display: "grid", gap: 6 }}>
          {assignments.map((a, idx) => (
            <li key={`${a.name}-${idx}`}>
              <strong>{a.name}</strong> → {a.owner}（{a.ownerStatus}） / next: {fmt(a.nextRunAtMs)}
            </li>
          ))}
        </ul>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        {members.map((m) => (
          <article
            key={m._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              background: statusColor(m.status),
            }}
          >
            <div style={{ fontWeight: 700 }}>{m.name}</div>
            <div style={{ fontSize: 13 }}>役割: {m.role}</div>
            <div style={{ fontSize: 13 }}>状態: {m.status}</div>
            <div style={{ fontSize: 13 }}>作業: {m.focus || "-"}</div>
            <div style={{ fontSize: 13 }}>担当: {m.ownsKeywords || "-"}</div>
          </article>
        ))}
      </div>
    </main>
  );
}
