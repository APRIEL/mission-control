import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const statusValidator = v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("timeout"));

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("approvals").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    source: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("approvals", {
      title: args.title,
      source: args.source,
      note: args.note,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("approvals"),
    status: statusValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: { status: "pending" | "approved" | "rejected" | "timeout"; updatedAt: number; note?: string } = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.note !== undefined) patch.note = args.note;
    await ctx.db.patch(args.id, patch);
  },
});
