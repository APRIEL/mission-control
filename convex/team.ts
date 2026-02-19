import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const statusValidator = v.union(
  v.literal("idle"),
  v.literal("working"),
  v.literal("blocked"),
  v.literal("offline")
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teamMembers").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    focus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("teamMembers", {
      name: args.name,
      role: args.role,
      focus: args.focus,
      status: "idle",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("teamMembers"),
    status: statusValidator,
    focus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: { status: "idle" | "working" | "blocked" | "offline"; focus?: string } = {
      status: args.status,
    };
    if (args.focus !== undefined) patch.focus = args.focus;
    await ctx.db.patch(args.id, patch);
  },
});
