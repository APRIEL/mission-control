"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function statusColor(status: string) {
  if (status === "working") return "#d1fae5";
  if (status === "blocked") return "#fee2e2";
  if (status === "idle") return "#fef3c7";
  return "#e5e7eb";
}

export default function OfficePage() {
  const members = useQuery(api.team.list) ?? [];

  const summary = useMemo(() => {
    return {
      total: members.length,
      working: members.filter((m) => m.status === "working").length,
      blocked: members.filter((m) => m.status === "blocked").length,
      idle: members.filter((m) => m.status === "idle").length,
      offline: members.filter((m) => m.status === "offline").length,
    };
  }, [members]);

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
          </article>
        ))}
      </div>
    </main>
  );
}
