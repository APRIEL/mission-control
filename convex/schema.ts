import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    status: v.union(v.literal("todo"), v.literal("doing"), v.literal("done")),
    assignee: v.union(v.literal("human"), v.literal("ai")),
    createdAt: v.number(),
  }),
  events: defineTable({
    title: v.string(),
    schedule: v.string(),
    source: v.union(v.literal("manual"), v.literal("openclaw-cron")),
    enabled: v.optional(v.boolean()),
    nextRunAtMs: v.optional(v.number()),
    createdAt: v.number(),
  }),
  contents: defineTable({
    title: v.string(),
    platform: v.union(v.literal("tiktok"), v.literal("2xko"), v.literal("other")),
    stage: v.union(
      v.literal("idea"),
      v.literal("draft"),
      v.literal("thumbnail"),
      v.literal("ready"),
      v.literal("posted")
    ),
    memo: v.optional(v.string()),
    sourcePath: v.optional(v.string()),
    factChecked: v.optional(v.boolean()),
    ctaChecked: v.optional(v.boolean()),
    postedChecked: v.optional(v.boolean()),
    discordMessageUrl: v.optional(v.string()),
    discordMessageId: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
