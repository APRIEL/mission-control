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
    schedule: v.string(), // 例: 毎日 09:00 JST
    source: v.union(v.literal("manual"), v.literal("openclaw-cron")),
    createdAt: v.number(),
  }),
});
