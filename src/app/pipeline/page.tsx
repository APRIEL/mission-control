"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "../../components/AppShell";

const STAGES = ["idea", "draft", "thumbnail", "ready", "posted"] as const;
type Stage = (typeof STAGES)[number];

function platformLabel(p: "tiktok" | "2xko" | "other") {
  if (p === "tiktok") return "TikTok";
  if (p === "2xko") return "2XKO";
  return "その他";
}

function stageLabel(s: Stage) {
  if (s === "idea") return "アイデア";
  if (s === "draft") return "下書き";
  if (s === "thumbnail") return "サムネ";
  if (s === "ready") return "最終確認";
  return "投稿済み";
}

function stageColor(s: Stage) {
  if (s === "idea") return { text: "#fbbf24", border: "#3a2f16" };
  if (s === "draft") return { text: "#60a5fa", border: "#1e3a8a" };
  if (s === "thumbnail") return { text: "#c084fc", border: "#4c1d95" };
  if (s === "ready") return { text: "#f472b6", border: "#831843" };
  return { text: "#fb923c", border: "#7c2d12" };
}

export default function PipelinePage() {
  const items = useQuery(api.contents.list) ?? [];
  const createItem = useMutation(api.contents.create);
  const updateStage = useMutation(api.contents.updateStage);
  const updateChecklist = useMutation(api.contents.updateChecklist);
  const updatePublishMeta = useMutation(api.contents.updatePublishMeta);
  const upsertFromDrafts = useMutation(api.contents.upsertFromDrafts);
  const addActivity = useMutation(api.activities.add);
  const createApproval = useMutation(api.approvals.create);

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

  const maybeCreateTimeoutApproval = async (raw: string, source: string) => {
    const m = String(raw).match(/approval-timeout.*id[=:\s]+([a-z0-9-]+)/i);
    if (!m?.[1]) return;
    const id = m[1];
    await createApproval({ title: `approval-timeout: ${id}`, source, note: "自動検出" });
    await addActivity({ type: "approval", message: "approval-timeout を自動起票", detail: `${source}: ${id}`, level: "warn" });
  };

  const syncDrafts = async () => {
    try {
      const res = await fetch("/api/pipeline/drafts");
      const data = await res.json();
      if (!data?.ok) {
        const msg = data?.error ?? "unknown";
        await maybeCreateTimeoutApproval(msg, "pipeline-drafts");
        await addActivity({ type: "pipeline", message: "下書き取込失敗", detail: msg, level: "warn" });
        return setSyncMessage("下書き取込失敗: " + msg);
      }
      const incoming = (data.items ?? []) as Array<{ title: string; platform: "tiktok" | "2xko" | "other"; stage: "draft"; memo?: string; sourcePath: string }>;
      await upsertFromDrafts({ items: incoming });
      await addActivity({ type: "pipeline", message: "下書き取込", detail: `${incoming.length}件`, level: "info" });
      setSyncMessage(`下書き取込完了: ${incoming.length}件`);
    } catch (e: any) {
      const msg = e?.message ?? "unknown";
      await maybeCreateTimeoutApproval(msg, "pipeline-drafts");
      await addActivity({ type: "pipeline", message: "下書き取込失敗", detail: msg, level: "warn" });
      setSyncMessage("下書き取込失敗: " + msg);
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
    await createItem({ title: title.trim(), platform, memo: memo.trim() || undefined });
    await addActivity({ type: "pipeline", message: "コンテンツ追加", detail: title.trim(), level: "info" });
    setTitle("");
    setMemo("");
  };

  const quickAddToStage = async (stage: Stage) => {
    const t = window.prompt(`${stageLabel(stage)} に追加するタイトル`, "");
    if (t === null || !t.trim()) return;
    const id = await createItem({ title: t.trim(), platform, memo: memo.trim() || undefined });
    if (stage !== "idea") {
      await updateStage({ id, stage });
    }
    await addActivity({ type: "pipeline", message: `ステージ追加: ${stageLabel(stage)}`, detail: t.trim(), level: "info" });
  };

  return (
    <AppShell active="pipeline" title="パイプライン">
      <div style={{ marginBottom: 14, opacity: 0.85 }}>アイデア → 下書き → サムネ → 最終確認 → 投稿済み</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
        {STAGES.map((stage) => {
          const c = stageColor(stage);
          return (
            <div key={`count-${stage}`} style={{ border: `1px solid ${c.border}`, borderRadius: 10, padding: 12, background: "#0f1420" }}>
              <div style={{ color: c.text, fontSize: 13, marginBottom: 6 }}>{stageLabel(stage)}</div>
              <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{grouped[stage].length}</div>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, marginBottom: 14, border: "1px solid #334155", borderRadius: 10, padding: 10, background: "#0f1420" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="新しいコンテンツ名（例: AI自動化で残業を減らす3手）" style={{ padding: 8 }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={platform} onChange={(e) => setPlatform(e.target.value as "tiktok" | "2xko" | "other")} style={{ padding: 8 }}>
            <option value="tiktok">TikTok</option>
            <option value="2xko">2XKO</option>
            <option value="other">その他</option>
          </select>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="メモ（任意）" style={{ flex: 1, minWidth: 180, padding: 8 }} />
          <button type="submit" style={{ padding: "8px 12px" }}>追加</button>
          <button type="button" onClick={syncDrafts} style={{ padding: "8px 12px" }}>下書き再取込</button>
        </div>
        {syncMessage && <div style={{ fontSize: 12, opacity: 0.85 }}>{syncMessage}</div>}
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
        {STAGES.map((stage) => {
          const c = stageColor(stage);
          return (
            <section key={stage} style={{ border: `1px solid ${c.border}`, borderRadius: 12, background: "#0b111b", minHeight: 420, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 10px 8px 10px", borderBottom: "1px solid #1f2937" }}>
                <strong style={{ color: c.text }}>{stageLabel(stage)}</strong>
                <button
                  onClick={() => quickAddToStage(stage)}
                  style={{ opacity: 0.85, background: "transparent", border: `1px solid ${c.border}`, color: c.text, borderRadius: 6, padding: "0 6px", cursor: "pointer" }}
                  title={`${stageLabel(stage)} に追加`}
                >
                  ＋
                </button>
              </div>

              <div style={{ padding: 8, display: "grid", gap: 8 }}>
                {grouped[stage].length === 0 ? (
                  <div style={{ opacity: 0.45, textAlign: "center", padding: "30px 0" }}>項目なし</div>
                ) : (
                  grouped[stage].map((item) => {
                    const fact = item.factChecked ?? false;
                    const cta = item.ctaChecked ?? false;
                    const posted = item.postedChecked ?? false;
                    const readyByChecklist = fact && cta;

                    return (
                      <article key={item._id} style={{ border: "1px solid #334155", borderRadius: 10, padding: 8, background: "#111827" }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{platformLabel(item.platform)}</div>
                        {item.memo && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>{item.memo}</div>}

                        <div style={{ marginTop: 8, display: "grid", gap: 2, fontSize: 12 }}>
                          <label><input type="checkbox" checked={fact} onChange={(e) => updateChecklist({ id: item._id, factChecked: e.target.checked })} /> 事実確認</label>
                          <label><input type="checkbox" checked={cta} onChange={(e) => updateChecklist({ id: item._id, ctaChecked: e.target.checked })} /> CTA確認</label>
                          <label><input type="checkbox" checked={posted} onChange={(e) => updateChecklist({ id: item._id, postedChecked: e.target.checked })} /> 投稿済み</label>
                        </div>

                        {item.stage === "ready" && (
                          <div style={{ marginTop: 8 }}>
                            {item.platform === "2xko" ? (
                              <button
                                style={{ fontSize: 12, padding: "4px 8px" }}
                                onClick={async () => {
                                  const res = await fetch("/api/publish/latest-2xko");
                                  const data = await res.json();
                                  if (!data?.ok || !data?.url) {
                                    const msg = data?.error ?? "2xko latest url fetch failed";
                                    await maybeCreateTimeoutApproval(msg, "publish-latest-2xko");
                                    await addActivity({ type: "pipeline", message: "2XKO公開URL自動取得失敗", detail: msg, level: "warn" });
                                    setSyncMessage("2XKO公開URLの自動取得に失敗しました。手動入力してください。");
                                    const manual = window.prompt("公開済みの記事URLを貼ってください", item.publishedUrl ?? "");
                                    if (manual === null) return;
                                    await updatePublishMeta({ id: item._id, publishedUrl: manual.trim() || undefined });
                                    return;
                                  }
                                  await updatePublishMeta({ id: item._id, publishedUrl: data.url });
                                  await addActivity({ type: "pipeline", message: "2XKO公開URL自動反映", detail: item.title, level: "info" });
                                  setSyncMessage("2XKO公開URLを自動反映して投稿済みにしました。");
                                }}
                              >
                                投稿完了（2XKO自動URL）
                              </button>
                            ) : (
                              <button
                                style={{ fontSize: 12, padding: "4px 8px" }}
                                onClick={async () => {
                                  const url = window.prompt("公開済みの記事URLを貼ってください（保存で自動POSTED化）", item.publishedUrl ?? "");
                                  if (url === null) return;
                                  await updatePublishMeta({ id: item._id, publishedUrl: url.trim() || undefined });
                                }}
                              >
                                記事URL保存→投稿完了
                              </button>
                            )}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                          {STAGES.map((s) => (
                            <button
                              key={s}
                              onClick={async () => {
                                await updateStage({ id: item._id, stage: s });
                                await addActivity({ type: "pipeline", message: `ステージ更新: ${stageLabel(s)}`, detail: item.title, level: "info" });
                              }}
                              style={{ fontSize: 11, padding: "3px 6px", opacity: s === item.stage ? 1 : 0.65 }}
                            >
                              {stageLabel(s)}
                            </button>
                          ))}
                          {readyByChecklist && item.stage !== "ready" && item.stage !== "posted" && (
                            <button onClick={() => updateStage({ id: item._id, stage: "ready" })} style={{ fontSize: 11, padding: "3px 6px" }}>
                              最終確認へ
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
