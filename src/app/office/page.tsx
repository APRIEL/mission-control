"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "../../components/AppShell";

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

function PixelAgent({ color, name, subtitle, speech }: { color: string; name: string; subtitle: string; speech?: string }) {
  return (
    <div style={{ textAlign: "center", position: "relative", minWidth: 120 }}>
      {speech && (
        <div style={{ position: "absolute", left: "50%", top: -34, transform: "translateX(-50%)", background: "rgba(15,23,42,0.95)", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px", fontSize: 11, maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={speech}>
          {speech}
        </div>
      )}
      <div style={{ position: "relative", width: 28, height: 28, margin: "0 auto 4px auto" }}>
        <div style={{ position: "absolute", left: 8, top: 0, width: 12, height: 8, background: color, border: "1px solid #0f172a" }} />
        <div style={{ position: "absolute", left: 6, top: 8, width: 16, height: 10, background: color, border: "1px solid #0f172a" }} />
        <div style={{ position: "absolute", left: 6, top: 18, width: 6, height: 8, background: color, border: "1px solid #0f172a" }} />
        <div style={{ position: "absolute", left: 16, top: 18, width: 6, height: 8, background: color, border: "1px solid #0f172a" }} />
        <div style={{ position: "absolute", left: 2, top: 10, width: 4, height: 6, background: color, border: "1px solid #0f172a" }} />
        <div style={{ position: "absolute", right: 2, top: 10, width: 4, height: 6, background: color, border: "1px solid #0f172a" }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700 }}>{name}</div>
      <div style={{ fontSize: 11, opacity: 0.8 }}>{subtitle}</div>
    </div>
  );
}

function fmt(ms?: number | null) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function jpJobName(name: string) {
  if (name === "content:2xko-daily-draft") return "2XKO記事下書き（毎日）";
  if (name === "content:tiktok-ai-automation-daily-pack") return "TikTok投稿パック（毎日）";
  if (name === "content:moltbook-auto-post-hourly-check") return "Moltbook投稿チェック（毎時）";
  if (name === "research:ai-monetization-hourly") return "収益化リサーチ（毎時）";
  if (name === "briefing:morning-daily") return "モーニングブリーフィング（毎日）";
  if (name === "healthcheck:backup-alert") return "バックアップ監視（2時間ごと）";
  if (name === "healthcheck:unattended-upgrades-alert") return "自動更新監視（2時間ごと）";
  if (name === "healthcheck:security-audit") return "セキュリティ監査（毎日）";
  if (name === "healthcheck:update-status") return "更新状況確認（毎日）";
  return `未翻訳ジョブ: ${name}`;
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
  const fixedAssignments = useQuery(api.cronAssignments.list) ?? [];
  const setCronAssignment = useMutation(api.cronAssignments.set);
  const addActivity = useMutation(api.activities.add);
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

  const summary = useMemo(() => ({
    total: members.length,
    working: members.filter((m) => m.status === "working").length,
    blocked: members.filter((m) => m.status === "blocked").length,
    idle: members.filter((m) => m.status === "idle").length,
    offline: members.filter((m) => m.status === "offline").length,
  }), [members]);

  const assignments = useMemo(() => {
    const fixedMap: Record<string, string> = {};
    for (const a of fixedAssignments) fixedMap[a.jobName] = a.memberId;

    return jobs.map((j) => {
      const forcedId = fixedMap[j.name];
      const forcedOwner = forcedId ? members.find((m) => m._id === forcedId) : undefined;

      if (forcedOwner) {
        return {
          ...j,
          owner: forcedOwner.name,
          ownerStatus: forcedOwner.status,
          ownerId: forcedOwner._id,
          mode: "固定",
        };
      }

      const lower = (j.name || "").toLowerCase();
      const owner = members.find((m) => {
        const keys = (m.ownsKeywords || "").split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
        return keys.some((k) => lower.includes(k));
      });
      return {
        ...j,
        owner: owner?.name ?? "未割当",
        ownerStatus: owner?.status ?? "-",
        ownerId: owner?._id ?? "",
        mode: "自動",
      };
    });
  }, [jobs, members, fixedAssignments]);

  return (
    <AppShell active="office" title="オフィス">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 12, fontSize: 13, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span>合計: {summary.total}</span>
          <span style={{ color: "#22c55e" }}>稼働中: {summary.working}</span>
          <span style={{ color: "#ef4444" }}>停止中: {summary.blocked}</span>
          <span style={{ color: "#f59e0b" }}>待機中: {summary.idle}</span>
          <span style={{ color: "#94a3b8" }}>オフライン: {summary.offline}</span>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 10px", border: "1px solid #334155", borderRadius: 999, background: "#0b1220" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#22c55e", display: "inline-block" }} />稼働中</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#ef4444", display: "inline-block" }} />停止中</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#f59e0b", display: "inline-block" }} />待機中</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#94a3b8", display: "inline-block" }} />オフライン</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
        <section style={{ position: "relative", minHeight: 620, borderRadius: 12, border: "1px solid #2b3444", overflow: "hidden", background: "linear-gradient(45deg, #1b1b1f 25%, #22232a 25%, #22232a 50%, #1b1b1f 50%, #1b1b1f 75%, #22232a 75%)", backgroundSize: "64px 64px" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 70, background: "#374151" }} />

          {SLOT_POSITIONS.map((p, idx) => (
            <div key={idx} style={{ position: "absolute", left: p.left, top: p.top, transform: "translate(-50%, -50%)" }}>
              <div style={{ width: 92, height: 12, background: "#a3a3a3", borderRadius: 2 }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px" }}><div style={{ width: 8, height: 26, background: "#737373" }} /><div style={{ width: 8, height: 26, background: "#737373" }} /></div>
              <div style={{ width: 26, height: 18, background: "#3b82f6", margin: "-50px auto 20px auto" }} />
            </div>
          ))}

          {members.slice(0, SLOT_POSITIONS.length).map((m, i) => {
            const pos = SLOT_POSITIONS[i];
            return (
              <div key={m._id} style={{ position: "absolute", left: pos.left, top: `calc(${pos.top} + 58px)`, transform: "translate(-50%, -50%)" }} title={`${m.name} (${m.status})`}>
                <PixelAgent color={statusColor(m.status)} name={m.name} subtitle={m.focus || m.role} speech={m.status === "working" ? m.focus || "作業中..." : undefined} />
              </div>
            );
          })}
        </section>

        <aside style={{ border: "1px solid #2b3444", borderRadius: 12, padding: 10, background: "#0f172a" }}>
          <strong>ジョブ担当マップ</strong>
          <ul style={{ margin: "10px 0 0 0", paddingLeft: 18, display: "grid", gap: 8, fontSize: 13 }}>
            {assignments.map((a, idx) => (
              <li key={`${a.name}-${idx}`}>
                <div style={{ fontWeight: 700 }}>{jpJobName(a.name)}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{a.name}</div>
                <div style={{ opacity: 0.85 }}>担当: {a.owner}（{a.ownerStatus}） <span style={{ fontSize: 11, opacity: 0.7 }}>[{a.mode}]</span></div>
                <div style={{ opacity: 0.75, marginBottom: 4 }}>次回: {fmt(a.nextRunAtMs)}</div>
                <select
                  value={a.mode === "固定" ? a.ownerId : ""}
                  onChange={async (e) => {
                    const next = e.target.value;
                    await setCronAssignment({ jobName: a.name, memberId: next || undefined });
                    await addActivity({ type: "office", message: "cron担当更新", detail: `${a.name} -> ${next ? members.find((m) => m._id === next)?.name ?? next : "自動"}`, level: "info" });
                  }}
                  style={{ width: "100%", padding: 4, borderRadius: 6, fontSize: 12 }}
                >
                  <option value="">自動（キーワード判定）</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
