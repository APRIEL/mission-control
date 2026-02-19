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
    const current = await ctx.db.get(args.id);
    if (!current) return;

    const nextFact = args.factChecked ?? current.factChecked ?? false;
    const nextCta = args.ctaChecked ?? current.ctaChecked ?? false;
    const nextPosted = args.postedChecked ?? current.postedChecked ?? false;

    const patch: {
      factChecked?: boolean;
      ctaChecked?: boolean;
      postedChecked?: boolean;
      stage?: "ready" | "posted";
    } = {};

    if (args.factChecked !== undefined) patch.factChecked = args.factChecked;
    if (args.ctaChecked !== undefined) patch.ctaChecked = args.ctaChecked;
    if (args.postedChecked !== undefined) patch.postedChecked = args.postedChecked;

    if (nextPosted) {
      patch.stage = "posted";
    } else if (nextFact && nextCta && current.stage !== "posted") {
      patch.stage = "ready";
    }

    await ctx.db.patch(args.id, patch);
  },
});

export const updatePublishMeta = mutation({
  args: {
    id: v.id("contents"),
    publishedUrl: v.optional(v.string()),
    discordMessageUrl: v.optional(v.string()),
    discordMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: {
      publishedUrl?: string;
      discordMessageUrl?: string;
      discordMessageId?: string;
      postedChecked?: boolean;
      stage?: "posted";
    } = {};

    if (args.publishedUrl !== undefined) {
      patch.publishedUrl = args.publishedUrl;
      if (args.publishedUrl && args.publishedUrl.trim().length > 0) {
        patch.postedChecked = true;
        patch.stage = "posted";
      }
    }
    if (args.discordMessageUrl !== undefined) patch.discordMessageUrl = args.discordMessageUrl;
    if (args.discordMessageId !== undefined) patch.discordMessageId = args.discordMessageId;

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
