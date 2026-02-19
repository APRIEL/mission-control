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

export const upsertFromCron = mutation({
  args: {
    items: v.array(
      v.object({
        title: v.string(),
        schedule: v.string(),
        enabled: v.boolean(),
        nextRunAtMs: v.union(v.number(), v.null()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const item of args.items) {
      const exists = await ctx.db
        .query("events")
        .filter((q) =>
          q.and(
            q.eq(q.field("title"), item.title),
            q.eq(q.field("source"), "openclaw-cron")
          )
        )
        .first();

      if (!exists) {
        await ctx.db.insert("events", {
          title: item.title,
          schedule: item.schedule,
          source: "openclaw-cron",
          enabled: item.enabled,
          nextRunAtMs: item.nextRunAtMs === null ? undefined : item.nextRunAtMs,
          createdAt: Date.now(),
        });
      } else {
        await ctx.db.patch(exists._id, {
          schedule: item.schedule,
          enabled: item.enabled,
          nextRunAtMs: item.nextRunAtMs === null ? undefined : item.nextRunAtMs,
        });
      }
    }
  },
});
