"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "../../components/AppShell";

const STATUSES = ["idle", "working", "blocked", "offline"] as const;
type Status = (typeof STATUSES)[number];

function roleVisual(slot: "chief" | "scout" | "quill" | "pixel" | "echo" | "codex" | "other") {
  if (slot === "chief") return { border: "#3b82f6", bg: "#151d2e", icon: "👑", chipBg: "#1e3a8a" };
  if (slot === "scout") return { border: "#10b981", bg: "#10231f", icon: "🔎", chipBg: "#064e3b" };
  if (slot === "quill") return { border: "#8b5cf6", bg: "#1e1833", icon: "✍️", chipBg: "#4c1d95" };
  if (slot === "pixel") return { border: "#ec4899", bg: "#2a1625", icon: "🎨", chipBg: "#831843" };
  if (slot === "echo") return { border: "#06b6d4", bg: "#10252b", icon: "📣", chipBg: "#155e75" };
  if (slot === "codex") return { border: "#f59e0b", bg: "#2a2013", icon: "💻", chipBg: "#7c2d12" };
  return { border: "#64748b", bg: "#1f2937", icon: "🧩", chipBg: "#334155" };
}

function statusDot(status: string) {
  if (status === "working") return "#22c55e";
  if (status === "blocked") return "#ef4444";
  if (status === "idle") return "#f59e0b";
  return "#94a3b8";
}

function tagsFromKeywords(s?: string) {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default function TeamPage() {
  const members = useQuery(api.team.list) ?? [];
  const createMember = useMutation(api.team.create);
  const updateStatus = useMutation(api.team.updateStatus);
  const updateOwnership = useMutation(api.team.updateOwnership);
  const removeMember = useMutation(api.team.remove);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [focus, setFocus] = useState("");
  const [ownsKeywords, setOwnsKeywords] = useState("");

  const ordered = useMemo(() => [...members].sort((a, b) => a.createdAt - b.createdAt), [members]);

  const findBy = (keys: string[]) =>
    ordered.find((m) => {
      const s = `${m.name} ${m.role} ${m.ownsKeywords || ""}`.toLowerCase();
      return keys.some((k) => s.includes(k));
    });

  const usedIds = new Set<string>();
  const take = (cand: any) => {
    if (!cand) return undefined;
    usedIds.add(cand._id);
    return cand;
  };

  const chief = take(findBy(["chief", "staff", "manager", "lead", "統括", "責任者", "マネージャー", "管理者"])) || take(ordered[0]);
  const scout = take(findBy(["scout", "analyst", "research", "調査", "リサーチ", "分析"]));
  const quill = take(findBy(["quill", "writer", "content", "ライター", "記事", "執筆", "コンテンツ"]));
  const pixel = take(findBy(["pixel", "design", "thumbnail", "デザイン", "サムネ", "画像"]));
  const echo = take(findBy(["echo", "social", "media", "sns", "ソーシャル", "投稿運用"]));
  const codex = take(findBy(["codex", "engineer", "developer", "dev", "開発", "エンジニア"]));

  const core = [scout, quill, pixel, echo].filter(Boolean) as typeof ordered;
  const meta = (codex ? [codex] : []).concat(ordered.filter((m) => !usedIds.has(m._id)).slice(0, 1)) as typeof ordered;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    await createMember({ name: name.trim(), role: role.trim(), focus: focus.trim() || undefined, ownsKeywords: ownsKeywords.trim() || undefined });
    setName("");
    setRole("");
    setFocus("");
    setOwnsKeywords("");
  };

  return (
    <AppShell active="team" title="チーム">
      <div style={{ textAlign: "center", marginBottom: 20, opacity: 0.9 }}>
        <div>{ordered.length} 名のメンバー（役割ごとに自動配置）</div>
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.75 }}>
          割り当て枠: 調査担当 / 執筆担当 / デザイン担当 / SNS担当 / 開発担当
        </div>
      </div>

      {chief && (
        <section
          style={{
            border: `1px solid ${roleVisual("chief").border}`,
            background: roleVisual("chief").bg,
            borderRadius: 12,
            padding: 14,
            maxWidth: 760,
            margin: "0 auto 24px auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${roleVisual("chief").border}`, display: "grid", placeItems: "center" }}>{roleVisual("chief").icon}</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{chief.name}</div>
            <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>統括カード →</span>
          </div>
          <div style={{ opacity: 0.85, marginTop: 2 }}>{chief.role}</div>
          <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>{chief.focus || "チーム全体の優先順位と進行を統括。"}</div>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tagsFromKeywords(chief.ownsKeywords).map((t) => (
              <span key={t} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 999, background: roleVisual("chief").chipBg }}>{t}</span>
            ))}
          </div>
        </section>
      )}

      <div style={{ textAlign: "center", fontSize: 12, opacity: 0.75, marginBottom: 10 }}>入力シグナル ───────── 出力アクション</div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 18 }}>
        {core.map((m, idx) => {
          const slot = (["scout", "quill", "pixel", "echo"] as const)[idx] ?? "other";
          const slotName = ["調査担当", "執筆担当", "デザイン担当", "SNS担当"][idx] ?? "担当";
          const c = roleVisual(slot);
          return (
            <article key={m._id} style={{ border: `1px solid ${c.border}`, background: c.bg, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>{slotName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${c.border}`, display: "grid", placeItems: "center" }}>{c.icon}</div>
                <strong>{m.name}</strong>
                <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 999, background: statusDot(m.status) }} />
              </div>
              <div style={{ marginTop: 4, opacity: 0.85 }}>{m.role}</div>
              <div style={{ marginTop: 4, opacity: 0.7, fontSize: 13 }}>{m.focus || "-"}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {tagsFromKeywords(m.ownsKeywords).map((t) => (
                  <span key={t} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 999, border: `1px solid ${c.border}` }}>{t}</span>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, opacity: 0.7 }}>役割カード →</div>
            </article>
          );
        })}
      </section>

      {meta.map((m) => {
        const c = roleVisual("codex");
        return (
          <section key={m._id} style={{ border: `1px solid ${c.border}`, background: c.bg, borderRadius: 12, padding: 12, maxWidth: 700, margin: "0 auto 24px auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${c.border}`, display: "grid", placeItems: "center" }}>{c.icon}</div>
              <strong>{m.name}</strong>
              <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 999, background: statusDot(m.status) }} />
            </div>
            <div style={{ marginTop: 4, opacity: 0.85 }}>{m.role}</div>
            <div style={{ marginTop: 4, opacity: 0.7, fontSize: 13 }}>{m.focus || "-"}</div>
          </section>
        );
      })}

      <details>
        <summary style={{ cursor: "pointer", marginBottom: 8 }}>メンバー管理（編集）</summary>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="メンバー名" style={{ padding: 8 }} />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="役割" style={{ padding: 8 }} />
          <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="現在フォーカス（任意）" style={{ padding: 8 }} />
          <input value={ownsKeywords} onChange={(e) => setOwnsKeywords(e.target.value)} placeholder="担当キーワード（カンマ区切り）" style={{ padding: 8 }} />
          <button type="submit" style={{ padding: "8px 12px", width: 120 }}>追加</button>
        </form>

        <div style={{ display: "grid", gap: 10 }}>
          {ordered.map((m) => (
            <article key={m._id} style={{ border: "1px solid #334155", borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{m.role} / {m.status}</div>
              <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => updateStatus({ id: m._id, status: s as Status })}>{s}</button>
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
                <button
                  onClick={async () => {
                    const ok = window.confirm(`本当に「${m.name}」を削除しますか？`);
                    if (!ok) return;
                    await removeMember({ id: m._id });
                  }}
                  style={{ border: "1px solid #7f1d1d", color: "#fecaca" }}
                >
                  削除
                </button>
              </div>
            </article>
          ))}
        </div>
      </details>
    </AppShell>
  );
}
