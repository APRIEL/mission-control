"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function fmt(ms?: number) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default function CalendarPage() {
  const events = useQuery(api.events.list) ?? [];
  const createEvent = useMutation(api.events.create);
  const upsertFromCron = useMutation(api.events.upsertFromCron);

  const [title, setTitle] = useState("");
  const [schedule, setSchedule] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const didAutoSync = useRef(false);

  const upcoming24h = useMemo(() => {
    const now = Date.now();
    const until = now + 24 * 60 * 60 * 1000;
    return events
      .filter((e) => e.nextRunAtMs && e.nextRunAtMs >= now && e.nextRunAtMs <= until)
      .sort((a, b) => (a.nextRunAtMs ?? 0) - (b.nextRunAtMs ?? 0));
  }, [events]);

  const syncFromOpenClaw = async () => {
    try {
      const res = await fetch("/api/openclaw/cron");
      const data = await res.json();
      if (!data?.ok) {
        setSyncMessage("cron取得失敗: " + (data?.error ?? "unknown"));
        return;
      }

      const items = (data.jobs ?? []).map((j: any) => ({
        title: j.name ?? "(no-name)",
        schedule: j.schedule ?? "-",
        enabled: !!j.enabled,
        nextRunAtMs: j.nextRunAtMs ?? null,
      }));

      await upsertFromCron({ items });
      setSyncMessage(`cron自動同期完了: ${items.length}件`);
    } catch (e: any) {
      setSyncMessage("cron取得失敗: " + (e?.message ?? "unknown"));
    }
  };

  useEffect(() => {
    if (didAutoSync.current) return;
    didAutoSync.current = true;
    syncFromOpenClaw();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !schedule.trim()) return;
    await createEvent({ title: title.trim(), schedule: schedule.trim(), source: "manual" });
    setTitle("");
    setSchedule("");
  };

  return (
    <main style={{ maxWidth: 980, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link href="/">Tasks</Link>
        <strong>Calendar</strong>
        <Link href="/pipeline">Pipeline</Link>
        <Link href="/memory">Memory</Link>
      </div>

      <h1>Mission Control - Calendar</h1>

      <button onClick={syncFromOpenClaw} style={{ padding: "8px 12px", marginBottom: 12 }}>
        OpenClaw cron を再同期
      </button>

      {syncMessage && <div style={{ marginBottom: 12, opacity: 0.9 }}>{syncMessage}</div>}

      <section style={{ border: "1px solid #666", borderRadius: 8, padding: 12, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>今後24時間の予定</h2>
        {upcoming24h.length === 0 ? (
          <div style={{ fontSize: 14, opacity: 0.8 }}>24時間以内の予定はありません。</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {upcoming24h.map((e) => (
              <li key={`up-${e._id}`}>
                <strong>{e.title}</strong> / {fmt(e.nextRunAtMs)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="イベント名" style={{ flex: 1, padding: 8 }} />
        <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="スケジュール" style={{ flex: 1, padding: 8 }} />
        <button type="submit" style={{ padding: "8px 12px" }}>追加</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
        {events.map((e) => {
          const cron = e.source === "openclaw-cron";
          return (
            <li key={e._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{e.title}</strong>
                <span
                  style={{
                    fontSize: 12,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: cron ? "#e8f0ff" : "#f3f3f3",
                  }}
                >
                  {e.source}
                </span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>schedule: {e.schedule}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                enabled: {e.enabled === undefined ? "-" : e.enabled ? "true" : "false"}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>next run (JST): {fmt(e.nextRunAtMs)}</div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
