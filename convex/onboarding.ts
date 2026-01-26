import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Set user's plan and mark as onboarded. auto-create workspace for Free users.
export const completeOnboarding = mutation({
    args: {
        plan: v.union(v.literal("free"), v.literal("premium")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        // Create a Personal workspace for both Free and Premium
        const existingWorkspaces = await ctx.db
            .query("members")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        // Only create if they don't have one (idempotency)
        if (existingWorkspaces.length === 0) {
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

            await ctx.db.patch(userId, {
                workspacesCreated: (user.workspacesCreated || 0) + 1,
            });
        }

        await ctx.db.patch(userId, {
            onboarded: true,
            subscriptionTier: args.plan,
        });

        return { success: true };
    },
});

// Set user's subscription tier (e.g. when starting a trial)
export const setSubscriptionTier = mutation({
    args: {
        tier: v.union(v.literal("free"), v.literal("premium")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }
        await ctx.db.patch(userId, {
            subscriptionTier: args.tier,
        });
    },
});

// Create a workspace (any type)
export const createSharedWorkspace = mutation({
    args: {
        name: v.string(),
        type: v.union(v.literal("personal"), v.literal("split"), v.literal("joint")),
        currency: v.string(),
        splitMethod: v.optional(v.union(v.literal("50/50"), v.literal("income"), v.literal("custom"))),
        monthlyTarget: v.optional(v.number()),
        ownerSplit: v.optional(v.number()), // Percentage (0-100) for owner in custom split
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const isPremium = user.subscriptionTier === "premium";

        // Enforce Premium for Split/Joint workspaces
        if ((args.type === "split" || args.type === "joint") && !isPremium) {
            throw new Error("Premium plan required for Shared Workspaces. Please upgrade.");
        }

        // Logic check: Enforce workspace limits (2 for Premium, 1 for Free)
        const limit = isPremium ? 2 : 1;
        const currentCount = user.workspacesCreated || 0;

        if (currentCount >= limit) {
            throw new Error(`Plan limit reached (${limit} workspace${limit > 1 ? 's' : ''}). Upgrade to Premium to create more.`);
        }

        let splitMethod = args.type === "split" ? (args.splitMethod || "50/50") : undefined;
        let customSplitConfig = undefined;

        // specific logic for custom split configuration
        if (args.type === "split") {
            if (args.ownerSplit !== undefined && args.ownerSplit !== 50) {
                splitMethod = "custom";
                customSplitConfig = JSON.stringify({
                    owner: args.ownerSplit,
                    member: 100 - args.ownerSplit
                });
            }
        }

        // Create the workspace
        const workspaceId = await ctx.db.insert("workspaces", {
            name: args.name,
            type: args.type,
            currency: args.currency,
            splitMethod: splitMethod as any, // Cast to any to satisfy union type if needed, or rely on type check
            monthlyTarget: args.type === "joint" ? args.monthlyTarget : undefined,
            customSplitConfig,
        });

        // Add the user as the owner
        await ctx.db.insert("members", {
            workspaceId,
            userId,
            role: "owner",
            joinedAt: Date.now(),
        });

        // Increment count and mark as onboarded (since this is the onboarding flow)
        await ctx.db.patch(userId, {
            workspacesCreated: (user.workspacesCreated || 0) + 1,
            onboarded: true,
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

