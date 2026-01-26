import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getBudgets = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const budgets = await ctx.db
            .query("category_budgets")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        return budgets;
    },
});

export const setBudget = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        category: v.string(),
        limit: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Check if a budget already exists for this category
        const existing = await ctx.db
            .query("category_budgets")
            .withIndex("by_workspaceId_and_category", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("category", args.category)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { limit: args.limit });
        } else {
            await ctx.db.insert("category_budgets", {
                workspaceId: args.workspaceId,
                category: args.category,
                limit: args.limit,
            });
        }
    },
});
