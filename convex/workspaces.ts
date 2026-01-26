import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { getAuthUserId } from "@convex-dev/auth/server";

export const createWorkspace = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("personal"), v.literal("split"), v.literal("joint")),
    currency: v.string(),
    splitMethod: v.optional(v.union(v.literal("50/50"), v.literal("income"), v.literal("custom"))),
    monthlyTarget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check workspace limits based on subscription tier
    const maxWorkspaces = user.subscriptionTier === "premium" ? 10 : 2;
    if ((user.workspacesCreated || 0) >= maxWorkspaces) {
      throw new Error(`You've reached the maximum ${maxWorkspaces} workspaces for your ${user.subscriptionTier} plan. Upgrade to premium for up to 10 workspaces.`);
    }

    // Create the workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      type: args.type,
      currency: args.currency,
      splitMethod: args.type === "split" ? (args.splitMethod || "50/50") : undefined,
      monthlyTarget: args.type === "joint" ? args.monthlyTarget : undefined,
    });

    // Add the creator as the owner member
    await ctx.db.insert("members", {
      workspaceId,
      userId: user._id,
      role: "owner",
      joinedAt: Date.now(),
    });

    // Update user's workspace count
    await ctx.db.patch(user._id, {
      workspacesCreated: (user.workspacesCreated || 0) + 1,
    });

    // Return the created workspace with the member info
    const workspace = await ctx.db.get(workspaceId);
    return {
      ...workspace,
      membersCount: 1,
    };
  },
});

export const getWorkspacesForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all workspaces where the user is a member
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const workspaceIds = memberships.map((m) => m.workspaceId);

    // Fetch the actual workspaces
    const workspaces = [];
    for (const workspaceId of workspaceIds) {
      const workspace = await ctx.db.get(workspaceId);
      if (workspace) {
        // Count members for this workspace
        const memberCount = await ctx.db
          .query("members")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
          .collect();

        workspaces.push({
          ...workspace,
          membersCount: memberCount.length,
          userRole: memberships.find((m) => m.workspaceId === workspaceId)?.role,
        });
      }
    }

    return workspaces;
  },
});

export const getWorkspaceWithMembers = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is a member of this workspace
    const membership = await ctx.db
      .query("members")
      .withIndex("by_workspaceId_and_userId", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership) {
      throw new Error("Access denied");
    }

    // Get the workspace
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Get all members
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Get user details for each member
    const membersWithDetails = [];
    for (const member of members) {
      const memberUser = await ctx.db.get(member.userId);
      if (memberUser) {
        membersWithDetails.push({
          ...member,
          user: {
            _id: memberUser._id,
            name: memberUser.name || "User",
            email: memberUser.email || "",
          },
        });
      }
    }

    return {
      ...workspace,
      members: membersWithDetails,
      currentUserRole: membership.role,
    };
  },
});

export const getWorkspaceMembers = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("members")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const getWorkspaceById = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workspaceId);
  },
});

export const addMemberToWorkspace = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("members", {
      workspaceId: args.workspaceId,
      userId: args.userId,
      role: args.role,
      joinedAt: Date.now(),
    });
  },
});

export const createPersonalWorkspace = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingWorkspaces = await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const membership of existingWorkspaces) {
      const workspace = await ctx.db.get(membership.workspaceId);
      if (workspace && workspace.type === "personal") {
        return;
      }
    }

    const workspaceId = await ctx.db.insert("workspaces", {
      name: "Personal",
      type: "personal",
      currency: "USD",
    });

    await ctx.db.insert("members", {
      workspaceId,
      userId: args.userId,
      role: "owner",
      joinedAt: Date.now(),
    });
  },
});

export const getWorkspaceBudget = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    return {
      monthlyBudget: workspace.monthlyBudget ?? 0,
    };
  },
});

export const setWorkspaceBudget = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    budget: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.workspaceId, {
      monthlyBudget: args.budget,
    });

    return { success: true };
  },
});

// Subscription-related queries and mutations
export const getUserSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const maxWorkspaces = user.subscriptionTier === "premium" ? 10 : 2;

    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      workspacesCreated: user.workspacesCreated,
      maxWorkspaces,
      canCreateWorkspace: (user.workspacesCreated || 0) < maxWorkspaces,
      expiresAt: user.subscriptionExpiresAt,
    };
  },
});

export const upgradeToPremium = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // In a real implementation, this would integrate with a payment processor
    // For now, we'll just update the user's subscription tier
    await ctx.db.patch(user._id, {
      subscriptionTier: "premium",
      subscriptionStatus: "active",
      subscriptionExpiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
    });

    return { success: true };
  },
});
// ... existing code ...

export const getWorkspaceStats = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Fetch expenses for this month
    // Note: expenses table has index by_workspaceId. We filter by date manually or compound index if available.
    // Ideally we'd have index by_workspaceId_and_date. For now, fetch all and filter.
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const monthlyExpenses = allExpenses.filter(e => e.date >= startOfMonth);
    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    // LOGIC FOR JOINT MODE
    let budgetRemaining = 0;
    if (workspace.type === "joint") {
      const target = workspace.monthlyTarget || 0;
      budgetRemaining = target - totalSpent;
    }

    // LOGIC FOR SPLIT MODE
    // Calculate balances. Positive = Owed to me. Negative = I owe.
    let myBalance = 0;

    if (workspace.type === "split") {
      const members = await ctx.db
        .query("members")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();
      const memberIds = members.map(m => m.userId);
      const ownerMember = members.find(m => m.role === "owner");
      const ownerId = ownerMember ? ownerMember.userId : "";

      // Initialize balance ledger
      const ledger: Record<string, number> = {};
      memberIds.forEach(id => ledger[id] = 0);

      // Process expenses
      const splitCount = memberIds.length || 1;

      // Parse custom config if exists
      let customOwnerShare = 0.5;
      let isCustom = false;
      if (workspace.type === "split" && workspace.splitMethod === "custom" && workspace.customSplitConfig) {
        try {
          const config = JSON.parse(workspace.customSplitConfig);
          // config format: { owner: 60, member: 40 }
          if (typeof config.owner === "number") {
            customOwnerShare = config.owner / 100;
            isCustom = true;
          }
        } catch (e) {
          console.error("Failed to parse split config", e);
        }
      }

      for (const expense of allExpenses) { // Settlement usually considers ALL time, not just this month
        // Payer gets credit
        const payerId = expense.paidBy;
        if (ledger[payerId] !== undefined) {
          ledger[payerId] += expense.amount;
        }

        // Split consumption (Debit)
        if (isCustom) {
          memberIds.forEach(id => {
            let share = 0;
            if (id === ownerId) {
              share = customOwnerShare;
            } else {
              // Distribute remainder equally among others
              const remainder = 1 - customOwnerShare;
              const otherCount = memberIds.length - 1;
              share = otherCount > 0 ? remainder / otherCount : 0;
            }
            ledger[id] -= expense.amount * share;
          });
        } else {
          // Default: Equal split
          const splitAmount = expense.amount / splitCount;
          memberIds.forEach(id => {
            ledger[id] -= splitAmount;
          });
        }
      }

      myBalance = ledger[userId] || 0;
    }

    return {
      totalSpent,
      budgetRemaining,
      myBalance, // For Split mode: Amount I am owed (if +) or owe (if -)
      monthlyTarget: workspace.monthlyTarget || 0,
    };
  },
});

export const updateWorkspaceSettings = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions (must be member/owner)
    const membership = await ctx.db
      .query("members")
      .withIndex("by_workspaceId_and_userId", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Access denied");
    }

    // Prepare updates
    const updates: { name?: string; currency?: string } = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.currency !== undefined) updates.currency = args.currency;

    await ctx.db.patch(args.workspaceId, updates);
    return { success: true };
  },
});
