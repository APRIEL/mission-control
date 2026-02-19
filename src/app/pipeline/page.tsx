"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const STAGES = ["idea", "draft", "thumbnail", "ready", "posted"] as const;
type Stage = (typeof STAGES)[number];

function platformLabel(p: "tiktok" | "2xko" | "other") {
  if (p === "tiktok") return "TikTok";
  if (p === "2xko") return "2XKO";
  return "Other";
}

export default function PipelinePage() {
  const items = useQuery(api.contents.list) ?? [];
  const createItem = useMutation(api.contents.create);
  const updateStage = useMutation(api.contents.updateStage);
  const upsertFromDrafts = useMutation(api.contents.upsertFromDrafts);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "2xko" | "other">("tiktok");
  const [memo, setMemo] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const didAutoSync = useRef(false);

  const grouped = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = items.filter((i) => i.stage === stage);
      return acc;
    }, {} as Record<Stage, typeof items>);
  }, [items]);

  const syncDrafts = async () => {
    try {
      const res = await fetch("/api/pipeline/drafts");
      const data = await res.json();
      if (!data?.ok) {
        setSyncMessage("下書き取込失敗: " + (data?.error ?? "unknown"));
        return;
      }

      const incoming = (data.items ?? []) as Array<{
        title: string;
        platform: "tiktok" | "2xko" | "other";
        stage: "draft";
        memo?: string;
        sourcePath: string;
      }>;

      await upsertFromDrafts({ items: incoming });
      setSyncMessage(`下書き取込完了: ${incoming.length}件`);
    } catch (e: any) {
      setSyncMessage("下書き取込失敗: " + (e?.message ?? "unknown"));
    }
  };

  useEffect(() => {
    if (didAutoSync.current) return;
    didAutoSync.current = true;
    syncDrafts();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createItem({
      title: title.trim(),
      platform,
      memo: memo.trim() || undefined,
    });
    setTitle("");
    setMemo("");
  };

  return (
    <main style={{ maxWidth: 1200, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link href="/">Tasks</Link>
        <Link href="/calendar">Calendar</Link>
        <strong>Pipeline</strong>
      </div>

      <h1>Mission Control - Content Pipeline</h1>

      <button onClick={syncDrafts} style={{ padding: "8px 12px", marginBottom: 12 }}>
        content-drafts を再取込
      </button>

      {syncMessage && <div style={{ marginBottom: 12, opacity: 0.9 }}>{syncMessage}</div>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, marginBottom: 20 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="コンテンツ名（例: AIで業務短縮3選）"
          style={{ padding: 8 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as "tiktok" | "2xko" | "other")}
            style={{ padding: 8 }}
          >
            <option value="tiktok">TikTok</option>
            <option value="2xko">2XKO</option>
            <option value="other">Other</option>
          </select>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモ（任意）"
            style={{ flex: 1, padding: 8 }}
          />
          <button type="submit" style={{ padding: "8px 12px" }}>追加</button>
        </div>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
        {STAGES.map((stage) => (
          <section key={stage} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8 }}>
            <h3 style={{ margin: "0 0 8px 0" }}>{stage.toUpperCase()}</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {grouped[stage].map((item) => (
                <article key={item._id} style={{ border: "1px solid #333", borderRadius: 8, padding: 8 }}>
                  <div style={{ fontWeight: 700 }}>{item.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{platformLabel(item.platform)}</div>
                  {item.memo && <div style={{ fontSize: 12, marginTop: 4 }}>{item.memo}</div>}
                  {item.sourcePath && (
                    <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4, wordBreak: "break-all" }}>
                      {item.sourcePath}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {STAGES.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStage({ id: item._id, stage: s })}
                        style={{ fontSize: 11, padding: "4px 6px", opacity: s === item.stage ? 1 : 0.7 }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
