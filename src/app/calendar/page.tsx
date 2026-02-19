"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function CalendarPage() {
  const events = useQuery(api.events.list) ?? [];
  const createEvent = useMutation(api.events.create);
  const seedIfEmpty = useMutation(api.events.seedIfEmpty);

  const [title, setTitle] = useState("");
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !schedule.trim()) return;
    await createEvent({
      title: title.trim(),
      schedule: schedule.trim(),
      source: "manual",
    });
    setTitle("");
    setSchedule("");
  };

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link href="/">Tasks</Link>
        <strong>Calendar</strong>
      </div>

      <h1>Mission Control - Calendar</h1>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="イベント名（例: 週次レビュー）"
          style={{ flex: 1, padding: 8 }}
        />
        <input
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          placeholder="スケジュール（例: 毎週 月曜 10:00 JST）"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>追加</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
        {events.map((e) => (
          <li key={e._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div><strong>{e.title}</strong></div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {e.schedule} / source: {e.source}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
