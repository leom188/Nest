import { internalQuery, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Type definitions
type Invitation = Doc<"invitations">;
type Workspace = Doc<"workspaces">;
type Member = Doc<"members">;

export const getActiveInvitationForWorkspace = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
  },
});

export const getInvitationByCode = internalQuery({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});

export const getInvitationById = internalQuery({
  args: {
    invitationId: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.invitationId);
  },
});

export const createInvitationRecord = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    code: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    createdBy: v.id("users"),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("invitations", {
      workspaceId: args.workspaceId,
      code: args.code,
      role: args.role,
      createdBy: args.createdBy,
      expiresAt: args.expiresAt,
      status: "pending",
    });
  },
});

export const updateInvitationStatus = internalMutation({
  args: {
    invitationId: v.id("invitations"),
    status: v.union(v.literal("accepted"), v.literal("expired"), v.literal("cancelled")),
    acceptedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const updates: { status: typeof args.status; acceptedBy?: typeof args.acceptedBy } = {
      status: args.status,
    };
    if (args.acceptedBy) {
      updates.acceptedBy = args.acceptedBy;
    }
    await ctx.db.patch(args.invitationId, updates);
  },
});

export const getPendingInvitationsByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    if (users.length === 0) {
      return [];
    }

    const userId = users[0]._id;

    const allInvitations = await ctx.db
      .query("invitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const validInvitations = [];
    const now = Date.now();

    for (const invitation of allInvitations) {
      if (invitation.expiresAt < now) {
        continue;
      }

      const workspace = await ctx.db.get(invitation.workspaceId);
      if (!workspace) continue;

      const members = await ctx.db
        .query("members")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", invitation.workspaceId))
        .collect();

      const isAlreadyMember = members.some((m) => m.userId === userId);
      if (isAlreadyMember) continue;

      validInvitations.push({
        ...invitation,
        workspaceName: workspace.name,
        workspaceType: workspace.type,
      });
    }

    return validInvitations;
  },
});

export const createInvitation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    role: v.union(v.literal("admin"), v.literal("member")),
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

    // Get workspace members using runQuery
    const members = await ctx.runQuery(internal.workspaces.getWorkspaceMembers, {
      workspaceId: args.workspaceId,
    });

    const membership: Member | undefined = members.find((m: Member) => m.userId === user._id);
    if (!membership) {
      throw new Error("Access denied");
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("Only owners and admins can create invitations");
    }

    const existing: Invitation | null = await ctx.runQuery(internal.invitations.getActiveInvitationForWorkspace, {
      workspaceId: args.workspaceId,
    });

    if (existing) {
      if (existing.expiresAt > Date.now()) {
        return {
          code: existing.code,
          expiresAt: existing.expiresAt,
          isExisting: true,
        };
      } else {
        await ctx.runMutation(internal.invitations.updateInvitationStatus, {
          invitationId: existing._id,
          status: "expired",
        });
      }
    }

    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = "";
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const existingCode = await ctx.runQuery(internal.invitations.getInvitationByCode, { code: code! });
      if (!existingCode) {
        isUnique = true;
      }
    }

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await ctx.runMutation(internal.invitations.createInvitationRecord, {
      workspaceId: args.workspaceId,
      code: code!,
      role: args.role,
      createdBy: user._id,
      expiresAt,
    });

    return {
      code: code!,
      expiresAt,
      isExisting: false,
    };
  },
});

export const acceptInvitationExistingUser = mutation({
  args: {
    code: v.string(),
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

    const invitation: Invitation | null = await ctx.runQuery(internal.invitations.getInvitationByCode, {
      code: args.code,
    });

    if (!invitation) {
      throw new Error("Invalid invitation code");
    }

    if (invitation.status !== "pending") {
      throw new Error("This invitation has already been used or cancelled");
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.runMutation(internal.invitations.updateInvitationStatus, {
        invitationId: invitation._id,
        status: "expired",
      });
      throw new Error("This invitation has expired");
    }

    const existingMember = await ctx.runQuery(internal.workspaces.getWorkspaceMembers, {
      workspaceId: invitation.workspaceId,
    });

    if (existingMember.some((m: Member) => m.userId === user._id)) {
      throw new Error("You are already a member of this workspace");
    }

    await ctx.runMutation(internal.workspaces.addMemberToWorkspace, {
      workspaceId: invitation.workspaceId,
      userId: user._id,
      role: invitation.role,
    });

    await ctx.runMutation(internal.invitations.updateInvitationStatus, {
      invitationId: invitation._id,
      status: "accepted",
      acceptedBy: user._id,
    });

    const workspace: Workspace | null = await ctx.runQuery(internal.workspaces.getWorkspaceById, {
      workspaceId: invitation.workspaceId,
    });

    return workspace;
  },
});

export const getPendingInvitations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return [];
    }

    const allInvitations = await ctx.db
      .query("invitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const validInvitations = [];
    const now = Date.now();

    for (const invitation of allInvitations) {
      if (invitation.expiresAt < now) {
        continue;
      }

      const members = await ctx.db
        .query("members")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", invitation.workspaceId))
        .collect();

      const isAlreadyMember = members.some((m) => m.userId === userId);
      if (isAlreadyMember) continue;

      const workspace = await ctx.db.get(invitation.workspaceId);
      if (!workspace) continue;

      validInvitations.push({
        _id: invitation._id,
        code: invitation.code,
        workspaceId: invitation.workspaceId,
        workspaceName: workspace.name,
        workspaceType: workspace.type,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      });
    }

    return validInvitations;
  },
});

export const getWorkspaceInvitations = query({
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

    const membership = await ctx.db
      .query("members")
      .withIndex("by_workspaceId_and_userId", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Access denied");
    }

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    type InvitationDetail = {
      _id: string;
      code: string;
      role: string;
      status: string;
      expiresAt: number;
      createdBy: { name: string; email: string } | null;
      acceptedBy: { name: string; email: string } | null;
    };

    const invitationsWithDetails: InvitationDetail[] = [];
    const now = Date.now();

    for (const invitation of invitations) {
      const createdBy = await ctx.db.get(invitation.createdBy);
      const acceptedBy = invitation.acceptedBy ? await ctx.db.get(invitation.acceptedBy) : null;

      let status = invitation.status;
      if (status === "pending" && invitation.expiresAt < now) {
        status = "expired";
      }

      invitationsWithDetails.push({
        _id: invitation._id,
        code: invitation.code,
        role: invitation.role,
        status,
        expiresAt: invitation.expiresAt,
        createdBy: createdBy ? { name: createdBy.name || "User", email: createdBy.email || "" } : null,
        acceptedBy: acceptedBy ? { name: acceptedBy.name || "User", email: acceptedBy.email || "" } : null,
      });
    }

    return invitationsWithDetails;
  },
});

export const cancelInvitation = mutation({
  args: {
    invitationId: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const workspace = await ctx.db.get(invitation.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const membership = await ctx.db
      .query("members")
      .withIndex("by_workspaceId_and_userId", (q) =>
        q.eq("workspaceId", invitation.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Access denied");
    }

    if (invitation.status !== "pending") {
      throw new Error("Cannot cancel a non-pending invitation");
    }

    await ctx.db.patch(args.invitationId, { status: "cancelled" });
    return { success: true };
  },
});

export const cleanupExpiredInvitations = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pendingInvitations = await ctx.db
      .query("invitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    let expiredCount = 0;
    for (const invitation of pendingInvitations) {
      if (invitation.expiresAt < now) {
        await ctx.db.patch(invitation._id, { status: "expired" });
        expiredCount++;
      }
    }

    return { expiredCount };
  },
});
