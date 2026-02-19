import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("activities").order("desc").collect();
    const limit = args.limit ?? 100;
    return all.slice(0, limit);
  },
});

export const add = mutation({
  args: {
    type: v.string(),
    message: v.string(),
    detail: v.optional(v.string()),
    level: v.optional(v.union(v.literal("info"), v.literal("warn"), v.literal("error"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      type: args.type,
      message: args.message,
      detail: args.detail,
      level: args.level ?? "info",
      createdAt: Date.now(),
    });
  },
});
