import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cronAssignments").order("desc").collect();
  },
});

export const set = mutation({
  args: {
    jobName: v.string(),
    memberId: v.optional(v.id("teamMembers")),
  },
  handler: async (ctx, args) => {
    const exists = await ctx.db
      .query("cronAssignments")
      .filter((q) => q.eq(q.field("jobName"), args.jobName))
      .first();

    if (!args.memberId) {
      if (exists) await ctx.db.delete(exists._id);
      return;
    }

    if (exists) {
      await ctx.db.patch(exists._id, { memberId: args.memberId, updatedAt: Date.now() });
      return;
    }

    await ctx.db.insert("cronAssignments", {
      jobName: args.jobName,
      memberId: args.memberId,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});
