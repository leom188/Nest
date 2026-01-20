import { mutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Set user's onboarding intent, mark as onboarded, and create Personal workspace if solo
export const completeOnboarding = mutation({
    args: {
        intent: v.union(v.literal("solo"), v.literal("partner"), v.literal("both")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        if (args.intent === "solo") {
            const workspaceId = await ctx.db.insert("workspaces", {
                name: "Personal",
                type: "personal",
                currency: "USD",
            });

            await ctx.db.insert("members", {
                workspaceId,
                userId,
                role: "owner",
                joinedAt: Date.now(),
            });

            // Increment workspacesCreated
            await ctx.db.patch(userId, {
                workspacesCreated: (user.workspacesCreated || 0) + 1,
            });
        }

        await ctx.db.patch(userId, {
            onboarded: true,
            intent: args.intent,
        });

        return { success: true };
    },
});

// Create a shared workspace (split or joint) for the user
export const createSharedWorkspace = mutation({
    args: {
        name: v.string(),
        type: v.union(v.literal("split"), v.literal("joint")),
        currency: v.string(),
        splitMethod: v.optional(v.union(v.literal("50/50"), v.literal("income"), v.literal("custom"))),
        monthlyTarget: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Create the workspace
        const workspaceId = await ctx.db.insert("workspaces", {
            name: args.name,
            type: args.type,
            currency: args.currency,
            splitMethod: args.type === "split" ? (args.splitMethod || "50/50") : undefined,
            monthlyTarget: args.type === "joint" ? args.monthlyTarget : undefined,
        });
        // Wait, workspaces table doesn't have workspacesCreated. Users table does.

        // Add the user as the owner
        await ctx.db.insert("members", {
            workspaceId,
            userId,
            role: "owner",
            joinedAt: Date.now(),
        });

        return { workspaceId };
    },
});

// Get onboarding status for a user - making it a public query
export const getOnboardingStatus = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            return null;
        }

        return {
            onboarded: user.onboarded,
            intent: user.intent,
        };
    },
});

// Check if a shared workspace has only one member (for InvitePartnerPrompt)
export const isWorkspaceSolo = query({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const members = await ctx.db
            .query("members")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        return members.length === 1;
    },
});

