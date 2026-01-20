
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    income: v.optional(v.number()),
    image: v.optional(v.string()),
    onboarded: v.optional(v.boolean()),
    prefersReducedMotion: v.optional(v.boolean()),
    monthlyBudget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    if (userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const { userId: _, ...updateData } = args;
    await ctx.db.patch(args.userId, updateData);

    return await ctx.db.get(args.userId);
  },
});
