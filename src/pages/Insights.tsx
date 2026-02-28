"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MonthlyOverview } from "../components/Insights/MonthlyOverview";
import { CategoryBreakdown } from "../components/Insights/CategoryBreakdown";
import { BudgetVsActual } from "../components/Insights/BudgetVsActual";
import { SpendingTrend } from "../components/Insights/SpendingTrend";
import { AISpendingSummary } from "../components/Insights/AISpendingSummary";
import { PremiumGate } from "../components/Insights/PremiumGate";
import { ExpenseHistory } from "../components/Insights/ExpenseHistory";

interface InsightsProps {
    workspaceId?: Id<"workspaces">;
}

// Demo data shown in the blurred PremiumGate preview for free users
const DEMO_TREND = [
    { month: "Sep", amount: 1200 },
    { month: "Oct", amount: 1850 },
    { month: "Nov", amount: 1400 },
    { month: "Dec", amount: 2100 },
    { month: "Jan", amount: 1650 },
    { month: "Feb", amount: 1930 },
];

export function Insights({ workspaceId }: InsightsProps) {
    const user = useQuery(api.users.current);
    const workspaces = useQuery(api.workspaces.getWorkspacesForUser);
    const activeWorkspaceId = workspaceId || workspaces?.[0]?._id;

    // Compute month boundaries in the BROWSER so we use the user's local timezone.
    // Never let the server guess "what month is it" in UTC — that shifts by offset.
    const now = new Date();
    const localMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const localMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    const spending = useQuery(
        api.expenses.getSpendingByCategory,
        activeWorkspaceId
            ? { workspaceId: activeWorkspaceId, startDate: localMonthStart, endDate: localMonthEnd }
            : "skip"
    );
    const budgets = useQuery(
        api.budgets.getBudgets,
        activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
    );
    const stats = useQuery(
        api.workspaces.getWorkspaceStats,
        activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
    );
    const trend = useQuery(
        api.expenses.getSpendingTrend,
        activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
    );
    const recurring = useQuery(
        api.recurring.getRecurring,
        activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip"
    );
    const expenses = useQuery(
        api.expenses.getExpensesForWorkspace,
        activeWorkspaceId ? { workspaceId: activeWorkspaceId, limit: 500 } : "skip"
    );
    const categories = useQuery(api.expenses.getCategories);

    const isPremium = user?.subscriptionTier === "premium";

    // Loading state
    if (!user || !activeWorkspaceId || !spending || !budgets || !stats || expenses === undefined || !categories || !recurring) {
        return (
            <div className="safe-top pt-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-nunito font-semibold text-sm">Loading insights...</p>
            </div>
        );
    }

    // Build Budget vs Actual:
    // budgets store category as display name ("Dining Out"),
    // spending uses the category ID ("dining").
    // Build a nameToId bridge from the categories list.
    const nameToId = new Map(
        categories.map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id])
    );
    const categoryInfoMap = new Map(
        categories.map((c: { id: string; name: string; emoji: string }) => [c.id, c])
    );
    // Key spending map by category ID for exact matching
    const spendingMap = new Map(
        spending.map((s: { category: string; name: string; emoji: string; amount: number }) => [s.category, s])
    );
    const budgetVsActualData = budgets.map((b: { category: string; limit: number }) => {
        // Convert budget display name → ID (e.g. "Dining Out" → "dining")
        const categoryId = nameToId.get(b.category.toLowerCase()) ?? b.category.toLowerCase().replace(/\s+/g, "");
        const spentItem = spendingMap.get(categoryId);
        const catInfo = categoryInfoMap.get(categoryId);
        return {
            category: categoryId,
            name: spentItem?.name || catInfo?.name || b.category,
            emoji: spentItem?.emoji || catInfo?.emoji || "💸",
            limit: b.limit,
            spent: spentItem?.amount || 0,
        };
    });

    const totalSpent = stats.totalSpent || 0;
    const transactionCount = stats.expenseCount ?? 0;

    // Calculate dynamic budget strategy (Sync with Dashboard.tsx and Plan.tsx):
    const budgetMap = new Map<string, number>();
    budgets.forEach(b => {
        budgetMap.set(b.category, b.limit);
    });

    const recurringMap = new Map<string, number>();
    recurring.forEach(r => {
        const amount = r.interval === "yearly" ? r.amount / 12 : r.amount;
        const current = recurringMap.get(r.category) || 0;
        recurringMap.set(r.category, current + amount);
    });

    const budgetCategories = new Set([...budgetMap.keys(), ...recurringMap.keys()]);

    let calculatedTotalBudget = 0;
    budgetCategories.forEach((cat: string) => {
        const allocated = budgetMap.get(cat) || 0;
        const recSum = recurringMap.get(cat) || 0;
        if (allocated > 0) {
            calculatedTotalBudget += allocated;
        } else {
            calculatedTotalBudget += recSum;
        }
    });

    const totalBudget = calculatedTotalBudget;

    const monthName = new Date().toLocaleString("default", { month: "long" });

    return (
        <div className="safe-top">
            <div className="pt-8 pb-6 px-4">
                {/* Header */}
                <h1 className="text-2xl font-bold font-quicksand text-gray-800 mb-1">{monthName} Insights</h1>
                <p className="text-sm text-gray-400 font-nunito mb-6">
                    {isPremium ? "Full picture · Premium" : "Basic view · Free"}
                </p>

                <div className="space-y-5">
                    {/* Section 1: Monthly Overview — Free + Premium */}
                    <MonthlyOverview
                        totalSpent={totalSpent}
                        budget={totalBudget}
                        transactionCount={transactionCount}
                    />

                    {/* Section 2: Category Breakdown — Free + Premium */}
                    <CategoryBreakdown
                        data={spending}
                        totalSpent={totalSpent}
                    />

                    {/* Section 3: Budget vs Actual — Free + Premium */}
                    <BudgetVsActual data={budgetVsActualData} />

                    {/* Section 4: Spending Trend — Premium only */}
                    {isPremium ? (
                        trend && <SpendingTrend data={trend} />
                    ) : (
                        <PremiumGate
                            title="Spending Trend"
                            description="See how your spending has changed over the last 6 months. Unlock with Premium."
                        >
                            <SpendingTrend data={DEMO_TREND} />
                        </PremiumGate>
                    )}

                    {/* Section 5: AI Spending Summary — Premium only */}
                    {isPremium && activeWorkspaceId ? (
                        <AISpendingSummary workspaceId={activeWorkspaceId} />
                    ) : !isPremium ? (
                        <PremiumGate
                            title="AI Spending Summary"
                            description="Get a personalized analysis of your spending habits from our AI assistant."
                        />
                    ) : null}

                    {/* Section 6: All Expenses — collapsible, collapsed by default */}
                    {activeWorkspaceId && expenses && expenses.length > 0 && (
                        <ExpenseHistory
                            expenses={expenses as any}
                            workspaceId={activeWorkspaceId}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
