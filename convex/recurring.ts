import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getRecurring = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        return await ctx.db
            .query("recurring_expenses")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();
    },
});

export const addRecurring = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        label: v.string(),
        amount: v.number(),
        category: v.string(),
        interval: v.union(v.literal("monthly"), v.literal("yearly")),
        nextDue: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.insert("recurring_expenses", {
            workspaceId: args.workspaceId,
            label: args.label,
            amount: args.amount,
            category: args.category,
            interval: args.interval,
            nextDue: args.nextDue,
        });
    },
});

export const deleteRecurring = mutation({
    args: { id: v.id("recurring_expenses") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});
