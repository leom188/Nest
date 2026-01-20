import { mutation } from "./_generated/server";

export const migrateUsersToSubscriptions = mutation({
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      // Count current workspaces owned by this user
      const memberships = await ctx.db
        .query("members")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      // Filter for owner role
      const ownedMemberships = memberships.filter((m) => m.role === "owner");

      const workspaceCount = ownedMemberships.length;

      // Update user with subscription data
      await ctx.db.patch(user._id, {
        subscriptionTier: "free",
        subscriptionStatus: "active",
        workspacesCreated: workspaceCount,
      });
    }

    return { success: true, usersUpdated: users.length };
  },
});

export const cleanupEmptyWorkspace = mutation({
  handler: async (ctx) => {
    // Find users with more than 2 workspaces (violates free tier limit)
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      const memberships = await ctx.db
        .query("members")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      const ownedMemberships = memberships.filter((m) => m.role === "owner");

      if (ownedMemberships.length > 2) {
        // User has more than 2 workspaces, find empty ones
        const workspaceIds = ownedMemberships.map(m => m.workspaceId);

        for (const workspaceId of workspaceIds) {
          // Check if workspace has any expenses
          const expenses = await ctx.db
            .query("expenses")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
            .take(1);

          if (expenses.length === 0) {
            // This workspace has no expenses, delete it
            // First delete all members
            const workspaceMembers = await ctx.db
              .query("members")
              .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
              .collect();

            for (const member of workspaceMembers) {
              await ctx.db.delete(member._id);
            }

            // Delete the workspace
            await ctx.db.delete(workspaceId);

            // Update user's workspace count
            await ctx.db.patch(user._id, {
              workspacesCreated: memberships.length - 1,
            });

            return {
              success: true,
              workspaceDeleted: workspaceId,
              userUpdated: user._id
            };
          }
        }
      }
    }

    return { success: false, message: "No empty workspaces found to clean up" };
  },
});