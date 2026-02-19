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
  if (status === "working") return "#22c55e";
  if (status === "blocked") return "#ef4444";
  if (status === "idle") return "#f59e0b";
  return "#94a3b8";
}

function fmt(ms?: number | null) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

const SLOT_POSITIONS = [
  { left: "18%", top: "28%" },
  { left: "34%", top: "28%" },
  { left: "50%", top: "28%" },
  { left: "66%", top: "28%" },
  { left: "24%", top: "58%" },
  { left: "42%", top: "58%" },
  { left: "60%", top: "58%" },
  { left: "78%", top: "58%" },
] as const;

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
    <main style={{ maxWidth: 1280, margin: "24px auto", fontFamily: "sans-serif", color: "#e5e7eb" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link href="/">Tasks</Link>
        <Link href="/calendar">Calendar</Link>
        <Link href="/pipeline">Pipeline</Link>
        <Link href="/memory">Memory</Link>
        <Link href="/team">Team</Link>
        <strong>Office</strong>
      </div>

      <h1>The Office</h1>
      <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 13 }}>
        <span>合計: {summary.total}</span>
        <span style={{ color: "#22c55e" }}>Working: {summary.working}</span>
        <span style={{ color: "#ef4444" }}>Blocked: {summary.blocked}</span>
        <span style={{ color: "#f59e0b" }}>Idle: {summary.idle}</span>
        <span style={{ color: "#94a3b8" }}>Offline: {summary.offline}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
        <section
          style={{
            position: "relative",
            minHeight: 620,
            borderRadius: 12,
            border: "1px solid #2b3444",
            overflow: "hidden",
            background:
              "linear-gradient(45deg, #1b1b1f 25%, #22232a 25%, #22232a 50%, #1b1b1f 50%, #1b1b1f 75%, #22232a 75%)",
            backgroundSize: "64px 64px",
          }}
        >
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 70, background: "#374151" }} />

          {SLOT_POSITIONS.map((p, idx) => (
            <div key={idx} style={{ position: "absolute", left: p.left, top: p.top, transform: "translate(-50%, -50%)" }}>
              <div style={{ width: 92, height: 12, background: "#a3a3a3", borderRadius: 2 }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px" }}>
                <div style={{ width: 8, height: 26, background: "#737373" }} />
                <div style={{ width: 8, height: 26, background: "#737373" }} />
              </div>
              <div style={{ width: 26, height: 18, background: "#3b82f6", margin: "-50px auto 20px auto" }} />
            </div>
          ))}

          {members.slice(0, SLOT_POSITIONS.length).map((m, i) => {
            const pos = SLOT_POSITIONS[i];
            return (
              <div
                key={m._id}
                style={{
                  position: "absolute",
                  left: pos.left,
                  top: `calc(${pos.top} + 54px)`,
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <div
                  title={`${m.name} (${m.status})`}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: statusColor(m.status),
                    margin: "0 auto 6px auto",
                    border: "2px solid #111827",
                    boxShadow: "0 0 0 2px rgba(255,255,255,0.06)",
                  }}
                />
                <div style={{ fontSize: 12, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{m.focus || m.role}</div>
              </div>
            );
          })}
        </section>

        <aside style={{ border: "1px solid #2b3444", borderRadius: 12, padding: 10, background: "#0f172a" }}>
          <strong>Job Assignments</strong>
          <ul style={{ margin: "10px 0 0 0", paddingLeft: 18, display: "grid", gap: 8, fontSize: 13 }}>
            {assignments.map((a, idx) => (
              <li key={`${a.name}-${idx}`}>
                <div style={{ fontWeight: 700 }}>{a.name}</div>
                <div style={{ opacity: 0.85 }}>
                  担当: {a.owner}（{a.ownerStatus}）
                </div>
                <div style={{ opacity: 0.75 }}>next: {fmt(a.nextRunAtMs)}</div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
