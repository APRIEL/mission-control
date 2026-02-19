"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";

type Hit = { file: string; line: number; text: string };

export default function MemoryPage() {
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
    setFiles(data.files ?? []);
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

  return (
    <AppShell active="memory" title="Memory">
      {status && <div style={{ marginBottom: 10, opacity: 0.8 }}>{status}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="キーワード検索（例: TikTok, 2XKO, モーニング）"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={search}>検索</button>
      </div>

      {hits.length > 0 && (
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <strong>検索結果</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: 18, display: "grid", gap: 6 }}>
            {hits.map((h, idx) => (
              <li key={`${h.file}-${h.line}-${idx}`}>
                <button onClick={() => loadFile(h.file)} style={{ marginRight: 6 }}>{h.file}#{h.line}</button>
                {h.text || "(空行)"}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 12 }}>
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
          <div style={{ marginBottom: 8 }}><button onClick={loadList}>一覧更新</button></div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {files.map((f) => (
              <li key={f}><button onClick={() => loadFile(f)} style={{ textDecoration: selected === f ? "underline" : "none" }}>{f}</button></li>
            ))}
          </ul>
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
          <div style={{ marginBottom: 8, opacity: 0.8 }}>{selected || "ファイル未選択"}</div>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13 }}>{content}</pre>
        </section>
      </div>
    </AppShell>
  );
}
