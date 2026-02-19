import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    status: v.union(v.literal("todo"), v.literal("doing"), v.literal("done")),
    assignee: v.union(v.literal("human"), v.literal("ai")),
    createdAt: v.number(),
  }),
});
