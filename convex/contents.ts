import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contents").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    platform: v.union(v.literal("tiktok"), v.literal("2xko"), v.literal("other")),
    memo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("contents", {
      title: args.title,
      platform: args.platform,
      stage: "idea",
      memo: args.memo,
      createdAt: Date.now(),
    });
  },
});

export const updateStage = mutation({
  args: {
    id: v.id("contents"),
    stage: v.union(
      v.literal("idea"),
      v.literal("draft"),
      v.literal("thumbnail"),
      v.literal("ready"),
      v.literal("posted")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { stage: args.stage });
  },
});
