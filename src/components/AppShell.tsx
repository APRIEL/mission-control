"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Key = "tasks" | "calendar" | "pipeline" | "memory" | "team" | "office";

const NAV: Array<{ key: Key; href: string; label: string; icon: string }> = [
  { key: "tasks", href: "/", label: "Tasks", icon: "✅" },
  { key: "pipeline", href: "/pipeline", label: "Content", icon: "🗂️" },
  { key: "calendar", href: "/calendar", label: "Calendar", icon: "🗓️" },
  { key: "memory", href: "/memory", label: "Memory", icon: "🧠" },
  { key: "team", href: "/team", label: "Team", icon: "👥" },
  { key: "office", href: "/office", label: "Office", icon: "🏢" },
];

export function AppShell({
  active,
  title,
  children,
}: {
  active: Key;
  title: string;
  children: React.ReactNode;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return NAV;
    return NAV.filter((n) => `${n.label} ${n.key}`.toLowerCase().includes(s));
  }, [q]);

  const runPageSearch = (forward = true) => {
    const s = q.trim();
    if (!s) return;
    if (typeof window !== "undefined" && typeof window.find === "function") {
      window.find(s, false, !forward, true, false, false, false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh", background: "#0b0f17", color: "#e5e7eb", fontFamily: "sans-serif" }}>
      <aside style={{ borderRight: "1px solid #1f2937", padding: "16px 12px" }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Mission Control</div>
        <nav style={{ display: "grid", gap: 6, fontSize: 14 }}>
          {filtered.map((n) =>
            n.key === active ? (
              <div key={n.key} style={{ padding: "6px 8px", borderRadius: 6, background: "#1f2937", fontWeight: 700 }}>
                <span style={{ marginRight: 8 }}>{n.icon}</span>
                {n.label}
              </div>
            ) : (
              <Link key={n.key} href={n.href} style={{ padding: "6px 8px", borderRadius: 6 }}>
                <span style={{ marginRight: 8 }}>{n.icon}</span>
                {n.label}
              </Link>
            )
          )}
        </nav>
      </aside>

      <main style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runPageSearch(true);
              }}
              placeholder="Search"
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "#111827", color: "#e5e7eb", minWidth: 180 }}
            />
            <button style={{ padding: "6px 10px" }} onClick={() => runPageSearch(true)}>Find</button>
            <button style={{ padding: "6px 10px" }} onClick={() => runPageSearch(false)}>Prev</button>
            <button style={{ padding: "6px 10px" }}>Pause</button>
            <button style={{ padding: "6px 10px" }}>Ping</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
