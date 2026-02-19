import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://2xko-news-jp.com/wp-json/wp/v2/posts?per_page=1&_fields=link,date,title",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `wp api status ${res.status}` }, { status: 502 });
    }

    const data = (await res.json()) as Array<{ link?: string; date?: string; title?: { rendered?: string } }>;
    const latest = data?.[0];
    if (!latest?.link) {
      return NextResponse.json({ ok: false, error: "latest post not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      url: latest.link,
      date: latest.date ?? null,
      title: latest.title?.rendered ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
  }
}
