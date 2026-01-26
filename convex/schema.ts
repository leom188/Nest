import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    income: v.optional(v.number()),
    onboarded: v.optional(v.boolean()),
    // Legacy field from old auth system (can be removed after data migration)
    authUserId: v.optional(v.string()),
    prefersReducedMotion: v.optional(v.boolean()),
    // User preferences
    monthlyBudget: v.optional(v.number()),
    currency: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    // Stores user's initial intent from onboarding
    intent: v.optional(v.union(v.literal("solo"), v.literal("partner"), v.literal("both"))),
    // Subscription system
    subscriptionTier: v.optional(v.union(v.literal("free"), v.literal("premium"))),
    subscriptionStatus: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("cancelled"))),
    subscriptionExpiresAt: v.optional(v.number()),
    workspacesCreated: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_subscriptionTier", ["subscriptionTier"]),

  workspaces: defineTable({
    name: v.string(),
    type: v.union(v.literal("personal"), v.literal("split"), v.literal("joint")),
    currency: v.string(),
    splitMethod: v.optional(v.union(v.literal("50/50"), v.literal("income"), v.literal("custom"))),
    monthlyTarget: v.optional(v.number()),
    monthlyBudget: v.optional(v.number()),
    // Store custom split percentages as JSON string ex: {"userId": 60, "userId2": 40}
    // Using string because record keys must be strings, and ids are specialized
    customSplitConfig: v.optional(v.string()),
  })
    .index("by_name", ["name"]),

  members: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
    // Track how much this member contributed to the "Bag" this month
    monthlyContribution: v.optional(v.number()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_userId", ["userId"])
    .index("by_workspaceId_and_userId", ["workspaceId", "userId"]),

  expenses: defineTable({
    workspaceId: v.id("workspaces"),
    paidBy: v.id("users"),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    date: v.number(),
    receiptImageUrl: v.optional(v.string()),
    isRecurring: v.boolean(),
    recurrenceRule: v.optional(v.string()),
    // Override default workspace split on a per-expense basis
    splitDetails: v.optional(v.record(v.id("users"), v.number())),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_paidBy", ["paidBy"])
    .index("by_date", ["date"]),

  // Track Joint Bag history and savings month-over-month
  monthlySnapshots: defineTable({
    workspaceId: v.id("workspaces"),
    month: v.number(),
    totalSpent: v.number(),
    totalContributed: v.number(),
    remainingSavings: v.number(),
  })
    .index("by_workspaceId_and_month", ["workspaceId", "month"]),

  invitations: defineTable({
    workspaceId: v.id("workspaces"),
    code: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    createdBy: v.id("users"),
    expiresAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"), v.literal("cancelled")),
    acceptedBy: v.optional(v.id("users")),
  })
    .index("by_code", ["code"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_status", ["status"]),

  category_budgets: defineTable({
    workspaceId: v.id("workspaces"),
    category: v.string(),
    limit: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_and_category", ["workspaceId", "category"]),

  recurring_expenses: defineTable({
    workspaceId: v.id("workspaces"),
    label: v.string(),
    amount: v.number(),
    category: v.string(),
    interval: v.union(v.literal("monthly"), v.literal("yearly")),
    lastProcessed: v.optional(v.number()),
    nextDue: v.optional(v.number()),
  })
    .index("by_workspaceId", ["workspaceId"]),
});

