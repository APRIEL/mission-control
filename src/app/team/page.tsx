"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const STATUSES = ["idle", "working", "blocked", "offline"] as const;

type Status = (typeof STATUSES)[number];

export default function TeamPage() {
  const members = useQuery(api.team.list) ?? [];
  const createMember = useMutation(api.team.create);
  const updateStatus = useMutation(api.team.updateStatus);
  const updateOwnership = useMutation(api.team.updateOwnership);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [focus, setFocus] = useState("");
  const [ownsKeywords, setOwnsKeywords] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    await createMember({
      name: name.trim(),
      role: role.trim(),
      focus: focus.trim() || undefined,
      ownsKeywords: ownsKeywords.trim() || undefined,
    });
    setName("");
    setRole("");
    setFocus("");
    setOwnsKeywords("");
  };

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link href="/">Tasks</Link>
        <Link href="/calendar">Calendar</Link>
        <Link href="/pipeline">Pipeline</Link>
        <Link href="/memory">Memory</Link>
        <strong>Team</strong>
        <Link href="/office">Office</Link>
      </div>

      <h1>Mission Control - Team</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, marginBottom: 20 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="メンバー名（例: Research Agent）" style={{ padding: 8 }} />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="役割（例: リサーチ）" style={{ padding: 8 }} />
        <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="現在フォーカス（任意）" style={{ padding: 8 }} />
        <input value={ownsKeywords} onChange={(e) => setOwnsKeywords(e.target.value)} placeholder="担当キーワード（カンマ区切り, 例: 2xko,tiktok,briefing）" style={{ padding: 8 }} />
        <button type="submit" style={{ padding: "8px 12px", width: 120 }}>追加</button>
      </form>

      <div style={{ display: "grid", gap: 10 }}>
        {members.map((m) => (
          <article key={m._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{m.name}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>役割: {m.role}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>状態: {m.status}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>作業: {m.focus || "-"}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>担当キーワード: {m.ownsKeywords || "-"}</div>

            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <button key={s} onClick={() => updateStatus({ id: m._id, status: s as Status })}>
                  {s}
                </button>
              ))}
              <button
                onClick={async () => {
                  const next = window.prompt("現在フォーカスを入力", m.focus ?? "");
                  if (next === null) return;
                  await updateStatus({ id: m._id, status: m.status as Status, focus: next.trim() || undefined });
                }}
              >
                作業更新
              </button>
              <button
                onClick={async () => {
                  const next = window.prompt("担当キーワード（カンマ区切り）", m.ownsKeywords ?? "");
                  if (next === null) return;
                  await updateOwnership({ id: m._id, ownsKeywords: next.trim() || undefined });
                }}
              >
                担当更新
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
