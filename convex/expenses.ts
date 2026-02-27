import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createExpense = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        amount: v.number(),
        description: v.string(),
        category: v.string(),
        date: v.number(),
        isRecurring: v.boolean(),
        recurrenceRule: v.optional(v.string()),
        splitDetails: v.optional(v.record(v.id("users"), v.number())),
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

        if (!membership) {
            throw new Error("You are not a member of this workspace");
        }

        const expenseId = await ctx.db.insert("expenses", {
            workspaceId: args.workspaceId,
            paidBy: user._id,
            amount: args.amount,
            description: args.description,
            category: args.category,
            date: args.date,
            isRecurring: args.isRecurring,
            recurrenceRule: args.recurrenceRule,
            splitDetails: args.splitDetails,
        });

        return { expenseId };
    },
});

export const createMultipleExpenses = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        expenses: v.array(v.object({
            amount: v.number(),
            description: v.string(),
            category: v.string(),
            date: v.number(),
            isRecurring: v.boolean(),
            recurrenceRule: v.optional(v.string()),
            splitDetails: v.optional(v.record(v.id("users"), v.number())),
        }))
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

        if (!membership) {
            throw new Error("You are not a member of this workspace");
        }

        const expenseIds = [];
        for (const exp of args.expenses) {
            const expenseId = await ctx.db.insert("expenses", {
                workspaceId: args.workspaceId,
                paidBy: user._id,
                amount: exp.amount,
                description: exp.description,
                category: exp.category,
                date: exp.date,
                isRecurring: exp.isRecurring,
                recurrenceRule: exp.recurrenceRule,
                splitDetails: exp.splitDetails,
            });
            expenseIds.push(expenseId);
        }

        return { expenseIds };
    },
});

export const getExpensesForWorkspace = query({
    args: {
        workspaceId: v.id("workspaces"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            return [];
        }

        const membership = await ctx.db
            .query("members")
            .withIndex("by_workspaceId_and_userId", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
            )
            .first();

        if (!membership) {
            return [];
        }

        const expenses = await ctx.db
            .query("expenses")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .order("desc")
            .take(args.limit || 50);

        const enrichedExpenses = [];
        for (const expense of expenses) {
            const payer = await ctx.db.get(expense.paidBy);
            enrichedExpenses.push({
                ...expense,
                payer: payer ? { name: payer.name, email: payer.email } : null,
            });
        }

        return enrichedExpenses;
    },
});

export const getCategories = query({
    args: {},
    handler: async () => {
        return [
            { id: "groceries", name: "Groceries", emoji: "🛒" },
            { id: "dining", name: "Dining Out", emoji: "🍕" },
            { id: "utilities", name: "Utilities", emoji: "💡" },
            { id: "rent", name: "Rent/Housing", emoji: "🏠" },
            { id: "transport", name: "Transport", emoji: "🚗" },
            { id: "entertainment", name: "Entertainment", emoji: "🎬" },
            { id: "health", name: "Health", emoji: "💊" },
            { id: "shopping", name: "Shopping", emoji: "🛍️" },
            { id: "subscriptions", name: "Subscriptions", emoji: "📱" },
            { id: "other", name: "Other", emoji: "📦" },
        ];
    },
});

export const updateExpense = mutation({
    args: {
        expenseId: v.id("expenses"),
        amount: v.optional(v.number()),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        date: v.optional(v.number()),
        isRecurring: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const expense = await ctx.db.get(args.expenseId);
        if (!expense) {
            throw new Error("Expense not found");
        }

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
                q.eq("workspaceId", expense.workspaceId).eq("userId", user._id)
            )
            .first();

        if (!membership) {
            throw new Error("Access denied");
        }

        if (
            expense.paidBy !== user._id &&
            membership.role !== "owner" &&
            membership.role !== "admin"
        ) {
            throw new Error("You can only edit your own expenses");
        }

        const updates: {
            amount?: number;
            description?: string;
            category?: string;
            date?: number;
            isRecurring?: boolean;
        } = {};

        if (args.amount !== undefined) updates.amount = args.amount;
        if (args.description !== undefined) updates.description = args.description;
        if (args.category !== undefined) updates.category = args.category;
        if (args.date !== undefined) updates.date = args.date;
        if (args.isRecurring !== undefined) updates.isRecurring = args.isRecurring;

        await ctx.db.patch(args.expenseId, updates);
        return { success: true };
    },
});

export const deleteExpense = mutation({
    args: {
        expenseId: v.id("expenses"),
    },
    handler: async (ctx, args) => {
        const expense = await ctx.db.get(args.expenseId);
        if (!expense) {
            throw new Error("Expense not found");
        }

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
                q.eq("workspaceId", expense.workspaceId).eq("userId", user._id)
            )
            .first();

        if (!membership) {
            throw new Error("Access denied");
        }

        if (
            expense.paidBy !== user._id &&
            membership.role !== "owner" &&
            membership.role !== "admin"
        ) {
            throw new Error("You can only delete your own expenses");
        }

        await ctx.db.delete(args.expenseId);
        return { success: true };
    },
});

export const getRecurringExpenses = query({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            return [];
        }

        const membership = await ctx.db
            .query("members")
            .withIndex("by_workspaceId_and_userId", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
            )
            .first();

        if (!membership) {
            return [];
        }

        const expenses = await ctx.db
            .query("expenses")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        const recurringExpenses = expenses.filter((e) => e.isRecurring);

        const enrichedRecurring = [];
        for (const expense of recurringExpenses) {
            const payer = await ctx.db.get(expense.paidBy);
            enrichedRecurring.push({
                ...expense,
                payer: payer ? { name: payer.name } : null,
            });
        }

        return enrichedRecurring;
    },
});

export const getSpendingByCategory = query({
    args: {
        workspaceId: v.id("workspaces"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            return [];
        }

        const membership = await ctx.db
            .query("members")
            .withIndex("by_workspaceId_and_userId", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
            )
            .first();

        if (!membership) {
            return [];
        }

        const now = new Date();
        const startOfMonth = args.startDate ?? new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const endOfMonth = args.endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

        const expenses = await ctx.db
            .query("expenses")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        const monthlyExpenses = expenses.filter(
            (e) => e.date >= startOfMonth && e.date <= endOfMonth
        );

        const categoryTotals: Record<string, number> = {};
        for (const expense of monthlyExpenses) {
            categoryTotals[expense.category] = (categoryTotals[expense.category] ?? 0) + expense.amount;
        }

        const categoryList = [
            { id: "groceries", name: "Groceries", emoji: "🛒" },
            { id: "dining", name: "Dining Out", emoji: "🍕" },
            { id: "utilities", name: "Utilities", emoji: "💡" },
            { id: "rent", name: "Rent/Housing", emoji: "🏠" },
            { id: "transport", name: "Transport", emoji: "🚗" },
            { id: "entertainment", name: "Entertainment", emoji: "🎬" },
            { id: "health", name: "Health", emoji: "💊" },
            { id: "shopping", name: "Shopping", emoji: "🛍️" },
            { id: "subscriptions", name: "Subscriptions", emoji: "📱" },
            { id: "other", name: "Other", emoji: "📦" },
        ];
        const categoryInfo = new Map(categoryList.map((c) => [c.id, c]));

        const breakdown = Object.entries(categoryTotals).map(([categoryId, total]) => ({
            category: categoryId,
            name: categoryInfo.get(categoryId)?.name ?? categoryId,
            emoji: categoryInfo.get(categoryId)?.emoji ?? "📦",
            amount: total,
        }));

        return breakdown.sort((a, b) => b.amount - a.amount);
    },
});

export const getSpendingByCategoryPerUser = query({
    args: {
        workspaceId: v.id("workspaces"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            return [];
        }

        const membership = await ctx.db
            .query("members")
            .withIndex("by_workspaceId_and_userId", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
            )
            .first();

        if (!membership) {
            return [];
        }

        const now = new Date();
        const startOfMonth = args.startDate ?? new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const endOfMonth = args.endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

        const expenses = await ctx.db
            .query("expenses")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        const monthlyExpenses = expenses.filter(
            (e) => e.date >= startOfMonth && e.date <= endOfMonth
        );

        // Group by user and category
        const userCategoryTotals: Record<string, Record<string, { userName: string; amount: number }>> = {};

        for (const expense of monthlyExpenses) {
            const payer = await ctx.db.get(expense.paidBy);
            if (!payer) continue;

            const userKey = payer._id;
            const categoryKey = expense.category;

            if (!userCategoryTotals[userKey]) {
                userCategoryTotals[userKey] = {};
            }

            if (!userCategoryTotals[userKey][categoryKey]) {
                userCategoryTotals[userKey][categoryKey] = {
                    userName: payer.name || "User",
                    amount: 0,
                };
            }

            userCategoryTotals[userKey][categoryKey].amount += expense.amount;
        }

        const categoryList = [
            { id: "groceries", name: "Groceries", emoji: "🛒" },
            { id: "dining", name: "Dining Out", emoji: "🍕" },
            { id: "utilities", name: "Utilities", emoji: "💡" },
            { id: "rent", name: "Rent/Housing", emoji: "🏠" },
            { id: "transport", name: "Transport", emoji: "🚗" },
            { id: "entertainment", name: "Entertainment", emoji: "🎬" },
            { id: "health", name: "Health", emoji: "💊" },
            { id: "shopping", name: "Shopping", emoji: "🛍️" },
            { id: "subscriptions", name: "Subscriptions", emoji: "📱" },
            { id: "other", name: "Other", emoji: "📦" },
        ];
        const categoryInfo = new Map(categoryList.map((c) => [c.id, c]));

        const result: Array<{
            userId: string;
            userName: string;
            categories: Array<{
                category: string;
                name: string;
                emoji: string;
                amount: number;
            }>;
            totalAmount: number;
        }> = [];

        for (const [userId, categories] of Object.entries(userCategoryTotals)) {
            const categoryBreakdown = Object.entries(categories).map(([categoryId, data]) => ({
                category: categoryId,
                name: categoryInfo.get(categoryId)?.name ?? categoryId,
                emoji: categoryInfo.get(categoryId)?.emoji ?? "📦",
                amount: data.amount,
            })).sort((a, b) => b.amount - a.amount);

            const totalAmount = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);

            result.push({
                userId,
                userName: categories[Object.keys(categories)[0]].userName,
                categories: categoryBreakdown,
                totalAmount,
            });
        }

        return result.sort((a, b) => b.totalAmount - a.totalAmount);
    },
});

export const getMonthlySpending = query({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return 0;
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            return 0;
        }

        const membership = await ctx.db
            .query("members")
            .withIndex("by_workspaceId_and_userId", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
            )
            .first();

        if (!membership) {
            return 0;
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();

        const expenses = await ctx.db
            .query("expenses")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        const monthlyExpenses = expenses.filter(
            (e) => e.date >= startOfMonth && e.date <= endOfMonth
        );

        return monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    },
});

export const getSpendingTrend = query({
    args: {
        workspaceId: v.id("workspaces"),
        months: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            return [];
        }

        const membership = await ctx.db
            .query("members")
            .withIndex("by_workspaceId_and_userId", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
            )
            .first();

        if (!membership) {
            return [];
        }

        const numMonths = args.months || 6;
        const now = new Date();
        const trend: { month: string; amount: number }[] = [];

        const expenses = await ctx.db
            .query("expenses")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        for (let i = numMonths - 1; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const startOfMonth = monthDate.getTime();
            const endOfMonth = nextMonthDate.getTime();

            const monthExpenses = expenses.filter(
                (e) => e.date >= startOfMonth && e.date <= endOfMonth
            );

            const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

            trend.push({
                month: monthDate.toLocaleDateString("en-US", { month: "short" }),
                amount: total,
            });
        }

        return trend;
    },
});
