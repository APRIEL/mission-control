"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "../../components/AppShell";

type Hit = { file: string; line: number; text: string };

function prettyFileName(file: string) {
  if (file === "MEMORY.md") return "長期メモリー";
  const m = file.match(/^memory\/(\d{4}-\d{2}-\d{2})\.md$/);
  if (m) return `Journal: ${m[1]}`;
  return file;
}

function parseJournalDate(file: string) {
  const m = file.match(/^memory\/(\d{4})-(\d{2})-(\d{2})\.md$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d);
}

function startOfDay(dt: Date) {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function groupLabel(file: string, now = new Date()) {
  const d = parseJournalDate(file);
  if (!d) return "その他";
  const today = startOfDay(now);
  const target = startOfDay(d);
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 1) return "昨日";
  if (diffDays >= 0 && diffDays <= 6) return "今週";
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) return "今月";
  return "過去";
}

export default function MemoryPage() {
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  const loadList = async () => {
    setStatus("読み込み中...");
    const res = await fetch("/api/memory/list");
    const data = await res.json();
    if (!data?.ok) return setStatus("一覧取得失敗");
    const list = (data.files ?? []) as string[];
    setFiles(list);
    if (!selected && list.length > 0) {
      const requested = searchParams.get("file") || "";
      const first = list.includes(requested) ? requested : list.includes("MEMORY.md") ? "MEMORY.md" : list[0];
      loadFile(first);
    }
    setStatus("");
  };

  const loadFile = async (file: string) => {
    setSelected(file);
    setStatus("ファイル読み込み中...");
    const res = await fetch(`/api/memory/read?file=${encodeURIComponent(file)}`);
    const data = await res.json();
    if (!data?.ok) {
      setStatus("読み込み失敗");
      setContent("");
      return;
    }
    setContent(data.content ?? "");
    setStatus("");
  };

  const search = async () => {
    const q = query.trim();
    if (!q) return setHits([]);
    setStatus("検索中...");
    const res = await fetch(`/api/memory/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!data?.ok) return setStatus("検索失敗");
    setHits((data.hits ?? []) as Hit[]);
    setStatus("");
  };

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    const requested = searchParams.get("file");
    if (!requested) return;
    if (files.includes(requested) && selected !== requested) {
      loadFile(requested);
    }
  }, [searchParams, files, selected]);

  const longTerm = useMemo(() => files.find((f) => f === "MEMORY.md"), [files]);
  const journals = useMemo(
    () => files.filter((f) => /^memory\/\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().reverse(),
    [files]
  );
  const groupedJournals = useMemo(() => {
    const groups: Record<string, string[]> = {
      "昨日": [],
      "今週": [],
      "今月": [],
      "過去": [],
    };

    for (const f of journals) {
      const key = groupLabel(f);
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    return groups;
  }, [journals]);

  return (
    <AppShell active="memory" title="メモリー">
      {status && <div style={{ marginBottom: 10, opacity: 0.8 }}>{status}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12 }}>
        <section style={{ border: "1px solid #1f2937", borderRadius: 10, background: "#0b111b", padding: 10 }}>
          <div style={{ marginBottom: 10 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="メモリーを検索..."
              style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #334155", background: "#111827", color: "#e5e7eb" }}
            />
          </div>

          {longTerm && (
            <button
              onClick={() => loadFile(longTerm)}
              style={{
                width: "100%",
                textAlign: "left",
                border: selected === longTerm ? "1px solid #7c3aed" : "1px solid #334155",
                background: selected === longTerm ? "#24143f" : "#111827",
                color: "#e5e7eb",
                borderRadius: 10,
                padding: 10,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>🧠 長期メモリー</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>MEMORY.md</div>
            </button>
          )}

          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>DAILY JOURNAL</div>
          <div style={{ display: "grid", gap: 10, maxHeight: "65vh", overflow: "auto" }}>
            {Object.entries(groupedJournals).map(([label, list]) =>
              list.length === 0 ? null : (
                <div key={label}>
                  <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>{label} ({list.length})</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {list.map((f) => (
                      <button
                        key={f}
                        onClick={() => loadFile(f)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: selected === f ? "1px solid #475569" : "1px solid #1f2937",
                          background: selected === f ? "#1f2937" : "#0f172a",
                          color: "#e5e7eb",
                          borderRadius: 10,
                          padding: 8,
                        }}
                      >
                        <div style={{ fontSize: 13 }}>{prettyFileName(f)}</div>
                        <div style={{ fontSize: 11, opacity: 0.65 }}>{f}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section style={{ border: "1px solid #1f2937", borderRadius: 10, background: "#0b111b", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #1f2937" }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{selected ? prettyFileName(selected) : "ファイル未選択"}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{selected || "左の一覧から選択"}</div>
          </div>

          {hits.length > 0 && (
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #1f2937", background: "#0f172a" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>検索結果</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                {hits.slice(0, 10).map((h, idx) => (
                  <li key={`${h.file}-${h.line}-${idx}`}>
                    <button onClick={() => loadFile(h.file)} style={{ marginRight: 6 }}>{h.file}#{h.line}</button>
                    <span style={{ opacity: 0.9 }}>{h.text || "(空行)"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ padding: 14, maxHeight: "72vh", overflow: "auto" }}>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13, lineHeight: 1.65 }}>{content}</pre>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
