import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    schedule: v.string(),
    source: v.union(v.literal("manual"), v.literal("openclaw-cron")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("events", {
      title: args.title,
      schedule: args.schedule,
      source: args.source,
      createdAt: Date.now(),
    });
  },
});

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("events").collect();
    if (rows.length > 0) return;

    const seed = [
      { title: "2XKO日次下書き", schedule: "毎日 09:00 JST", source: "openclaw-cron" as const },
      { title: "TikTok日次投稿パック", schedule: "毎日 09:00 JST", source: "openclaw-cron" as const },
      { title: "AI収益化ニュース収集", schedule: "毎時 00分 JST", source: "openclaw-cron" as const },
      { title: "モーニングブリーフィング", schedule: "毎日 09:00 JST", source: "openclaw-cron" as const },
    ];

    for (const e of seed) {
      await ctx.db.insert("events", { ...e, createdAt: Date.now() });
    }
  },
});
