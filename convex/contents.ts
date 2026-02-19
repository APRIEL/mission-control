import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const stageValidator = v.union(
  v.literal("idea"),
  v.literal("draft"),
  v.literal("thumbnail"),
  v.literal("ready"),
  v.literal("posted")
);

const platformValidator = v.union(v.literal("tiktok"), v.literal("2xko"), v.literal("other"));

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contents").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    platform: platformValidator,
    memo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("contents", {
      title: args.title,
      platform: args.platform,
      stage: "idea",
      memo: args.memo,
      factChecked: false,
      ctaChecked: false,
      postedChecked: false,
      createdAt: Date.now(),
    });
  },
});

export const updateStage = mutation({
  args: {
    id: v.id("contents"),
    stage: stageValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { stage: args.stage });
  },
});

export const updateChecklist = mutation({
  args: {
    id: v.id("contents"),
    factChecked: v.optional(v.boolean()),
    ctaChecked: v.optional(v.boolean()),
    postedChecked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: { factChecked?: boolean; ctaChecked?: boolean; postedChecked?: boolean; stage?: "posted" } = {};
    if (args.factChecked !== undefined) patch.factChecked = args.factChecked;
    if (args.ctaChecked !== undefined) patch.ctaChecked = args.ctaChecked;
    if (args.postedChecked !== undefined) patch.postedChecked = args.postedChecked;
    if (args.postedChecked === true) patch.stage = "posted";
    await ctx.db.patch(args.id, patch);
  },
});

export const upsertFromDrafts = mutation({
  args: {
    items: v.array(
      v.object({
        title: v.string(),
        platform: platformValidator,
        stage: stageValidator,
        memo: v.optional(v.string()),
        sourcePath: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const item of args.items) {
      const exists = await ctx.db
        .query("contents")
        .filter((q) => q.eq(q.field("sourcePath"), item.sourcePath))
        .first();

      if (exists) {
        await ctx.db.patch(exists._id, {
          title: item.title,
          platform: item.platform,
          stage: item.stage,
          memo: item.memo,
        });
        continue;
      }

      await ctx.db.insert("contents", {
        title: item.title,
        platform: item.platform,
        stage: item.stage,
        memo: item.memo,
        sourcePath: item.sourcePath,
        factChecked: false,
        ctaChecked: false,
        postedChecked: false,
        createdAt: Date.now(),
      });
    }
  },
});
