"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "../../components/AppShell";

type WeekItem = {
  id: string;
  title: string;
  timeLabel: string;
  day: number; // 0=Sun ... 6=Sat
  color: string;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(ms?: number) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function hhmmJst(ms?: number) {
  if (!ms) return "--:--";
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).format(new Date(ms));
}

function dayOfWeekJst(ms?: number) {
  if (!ms) return null;
  const d = new Date(new Date(ms).toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  return d.getDay();
}

function relFromNow(ms?: number) {
  if (!ms) return "-";
  const diff = ms - Date.now();
  if (diff <= 0) return "now";
  const min = Math.round(diff / 60000);
  if (min < 60) return `in ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `in ${h} hours`;
  const d = Math.round(h / 24);
  return `in ${d} days`;
}

function extractCronExpr(schedule: string) {
  const i = schedule.indexOf(" (");
  return i > 0 ? schedule.slice(0, i).trim() : schedule.trim();
}

function colorByTitle(title: string) {
  const t = title.toLowerCase();
  if (t.includes("brief")) return "#7c5c15";
  if (t.includes("security") || t.includes("healthcheck")) return "#5b1f30";
  if (t.includes("2xko")) return "#4c1d95";
  if (t.includes("tiktok")) return "#0f766e";
  return "#1f3a8a";
}

function buildWeekItems(events: any[]): WeekItem[] {
  const out: WeekItem[] = [];

  for (const e of events) {
    const title = e.title as string;
    const color = colorByTitle(title);
    const expr = extractCronExpr(e.schedule || "");
    const parts = expr.split(/\s+/);

    // fallback: place by nextRun day only
    const fallbackDay = dayOfWeekJst(e.nextRunAtMs) ?? 0;
    const fallbackTime = hhmmJst(e.nextRunAtMs);

    if (parts.length >= 5) {
      const [min, hour, dom, _mon, dow] = parts;
      const isDaily = dom === "*" && dow === "*";
      const isWeeklyNum = /^\d$/.test(dow);

      if (isDaily) {
        for (let d = 0; d < 7; d++) {
          out.push({
            id: `${e._id}-${d}`,
            title,
            timeLabel: /^\d+$/.test(hour) && /^\d+$/.test(min) ? `${hour.padStart(2, "0")}:${min.padStart(2, "0")}` : fallbackTime,
            day: d,
            color,
          });
        }
        continue;
      }

      if (isWeeklyNum) {
        out.push({
          id: `${e._id}-w${dow}`,
          title,
          timeLabel: /^\d+$/.test(hour) && /^\d+$/.test(min) ? `${hour.padStart(2, "0")}:${min.padStart(2, "0")}` : fallbackTime,
          day: Number(dow) % 7,
          color,
        });
        continue;
      }
    }

    out.push({ id: `${e._id}-f`, title, timeLabel: fallbackTime, day: fallbackDay, color });
  }

  return out;
}

export default function CalendarPage() {
  const events = useQuery(api.events.list) ?? [];
  const createEvent = useMutation(api.events.create);
  const upsertFromCron = useMutation(api.events.upsertFromCron);

  const [title, setTitle] = useState("");
  const [schedule, setSchedule] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [mode, setMode] = useState<"week" | "today">("week");
  const didAutoSync = useRef(false);

  const upcoming24h = useMemo(() => {
    const now = Date.now();
    const until = now + 24 * 60 * 60 * 1000;
    return events
      .filter((e) => e.nextRunAtMs && e.nextRunAtMs >= now && e.nextRunAtMs <= until)
      .sort((a, b) => (a.nextRunAtMs ?? 0) - (b.nextRunAtMs ?? 0));
  }, [events]);

  const alwaysRunning = useMemo(() => {
    return events.filter((e) => (e.schedule || "").includes("*/") || (e.schedule || "").includes("* * * *"));
  }, [events]);

  const weekItems = useMemo(() => buildWeekItems(events), [events]);

  const groupedByDay = useMemo(() => {
    const map: Record<number, WeekItem[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const it of weekItems) map[it.day].push(it);
    for (let d = 0; d < 7; d++) map[d].sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
    return map;
  }, [weekItems]);

  const todayDay = useMemo(() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    return d.getDay();
  }, []);

  const todayBoardItems = useMemo(() => groupedByDay[todayDay] ?? [], [groupedByDay, todayDay]);

  const syncFromOpenClaw = async () => {
    try {
      const res = await fetch("/api/openclaw/cron");
      const data = await res.json();
      if (!data?.ok) return setSyncMessage("cron取得失敗: " + (data?.error ?? "unknown"));

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
    <AppShell active="calendar" title="Scheduled Tasks">
      {syncMessage && <div style={{ marginBottom: 10, opacity: 0.85 }}>{syncMessage}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => setMode("week")}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: mode === "week" ? "#1f2937" : "#0f172a" }}
        >
          Week
        </button>
        <button
          onClick={() => setMode("today")}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: mode === "today" ? "#1f2937" : "#0f172a" }}
        >
          Today
        </button>
      </div>

      <section style={{ border: "1px solid #273244", background: "#101522", borderRadius: 10, padding: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>⚡ Always Running</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {alwaysRunning.length === 0 ? (
            <span style={{ opacity: 0.75 }}>none</span>
          ) : (
            alwaysRunning.slice(0, 8).map((e) => (
              <span key={e._id} style={{ background: "#1e3a8a", border: "1px solid #3b82f6", borderRadius: 999, fontSize: 12, padding: "4px 10px" }}>
                {e.title}
              </span>
            ))
          )}
        </div>
      </section>

      {mode === "week" ? (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 8, marginBottom: 14 }}>
          {DAY_LABELS.map((label, d) => (
            <div key={label} style={{ border: "1px solid #273244", borderRadius: 10, background: d === todayDay ? "#101a33" : "#101522", minHeight: 250, padding: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, opacity: 0.9 }}>{label}</div>
              <div style={{ display: "grid", gap: 6 }}>
                {groupedByDay[d].slice(0, 6).map((it) => (
                  <div key={it.id} style={{ border: "1px solid #334155", borderLeft: `4px solid ${it.color}`, background: "#1b2130", borderRadius: 8, padding: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{it.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.75 }}>{it.timeLabel}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section style={{ border: "1px solid #273244", borderRadius: 10, background: "#101522", padding: 10, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Today ({DAY_LABELS[todayDay]})</div>
          <div style={{ display: "grid", gap: 6 }}>
            {todayBoardItems.length === 0 ? (
              <div style={{ opacity: 0.75 }}>今日の予定はありません。</div>
            ) : (
              todayBoardItems.map((it) => (
                <div key={it.id} style={{ border: "1px solid #334155", borderLeft: `4px solid ${it.color}`, background: "#1b2130", borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{it.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{it.timeLabel}</div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <section style={{ border: "1px solid #273244", background: "#101522", borderRadius: 10, padding: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>📅 Next Up</div>
        {upcoming24h.length === 0 ? (
          <div style={{ opacity: 0.75 }}>24時間以内の予定はありません。</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {upcoming24h.map((e) => (
              <li key={e._id}>
                <strong>{e.title}</strong> / {fmt(e.nextRunAtMs)} <span style={{ opacity: 0.75 }}>({relFromNow(e.nextRunAtMs)})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details>
        <summary style={{ cursor: "pointer", marginBottom: 8 }}>手動イベント追加</summary>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="イベント名" style={{ flex: 1, padding: 8 }} />
          <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="スケジュール" style={{ flex: 1, padding: 8 }} />
          <button type="submit" style={{ padding: "8px 12px" }}>追加</button>
          <button type="button" onClick={syncFromOpenClaw} style={{ padding: "8px 12px" }}>再同期</button>
        </form>
      </details>
    </AppShell>
  );
}
