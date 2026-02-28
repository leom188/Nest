"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Pencil, Lock } from "lucide-react";
import { SetBudgetModal } from "../components/ui/SetBudgetModal";
import { SetIncomeModal } from "../components/Plan/SetIncomeModal";
import { BudgetTab } from "../components/Plan/BudgetTab";
import { RecurringTab } from "../components/Plan/RecurringTab";


interface PlanProps {
    workspaceId: Id<"workspaces">;
}

export function Plan({ workspaceId }: PlanProps) {
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);

    const workspaces = useQuery(api.workspaces.getWorkspacesForUser);
    const activeWorkspaceId = workspaceId || workspaces?.[0]?._id;

    const user = useQuery(api.users.current);
    const budgetFn = useQuery(api.budgets.getBudgets, activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip");
    const recurringFn = useQuery(api.recurring.getRecurring, activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip");

    const isPremium = user?.subscriptionTier === "premium";

    // Calculate dynamic budget strategy:
    // 1. If a category has a set Budget (Allocations), use that.
    // 2. If a category has NO set Budget, but has Recurring Expenses, use the sum of those.
    const budgetMap = new Map<string, number>();
    budgetFn?.forEach(b => {
        budgetMap.set(b.category, b.limit);
    });

    const recurringMap = new Map<string, number>();
    recurringFn?.forEach(r => {
        const amount = r.interval === "yearly" ? r.amount / 12 : r.amount;
        const current = recurringMap.get(r.category) || 0;
        recurringMap.set(r.category, current + amount);
    });

    const allCategories = new Set([...budgetMap.keys(), ...recurringMap.keys()]);

    let totalBudget = 0;
    allCategories.forEach(cat => {
        const allocated = budgetMap.get(cat) || 0;
        const recurring = recurringMap.get(cat) || 0;
        if (allocated > 0) {
            totalBudget += allocated;
        } else {
            totalBudget += recurring;
        }
    });

    const budget = totalBudget;
    const income = user?.income ?? 0;
    const budgetPercent = income > 0 ? (budget / income) * 100 : 0;
    const monthName = new Date().toLocaleString("default", { month: "long" });
    const remaining = income - budget;

    if (!user || !activeWorkspaceId) {
        return (
            <div className="min-h-screen bg-otter-white flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-nunito font-semibold">Loading your plan...</p>
            </div>
        );
    }

    return (
        <div className="bg-otter-white">
            {/* Full-bleed indigo hero header */}
            <div className="full-bleed bg-[#4F46E5] safe-top">
                <div className="max-w-md mx-auto px-6 pt-14 pb-16">
                    {/* Page title */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-lg font-bold font-quicksand text-white/90">
                            {monthName}'s Plan
                        </h1>
                        {isPremium && (
                            <span className="text-xs font-bold font-nunito text-white/60 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                ✦ Premium
                            </span>
                        )}
                    </div>

                    {/* Hero metric */}
                    {isPremium ? (
                        <div className="text-center">
                            <h2 className="text-5xl font-bold font-quicksand text-white mb-1 tabular-nums tracking-tight">
                                ${budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                            <p className="text-white/60 font-nunito text-xs font-semibold uppercase tracking-widest">
                                Cost to Be Me
                            </p>
                            {income > 0 && (
                                <p className={`mt-2 text-sm font-nunito font-bold tabular-nums ${remaining >= 0 ? "text-green-300" : "text-red-300"}`}>
                                    {remaining >= 0
                                        ? `$${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left from income`
                                        : `$${Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} over income`
                                    }
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center">
                            <h2 className="text-5xl font-bold font-quicksand text-white mb-1 tabular-nums tracking-tight">
                                ${budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                            <p className="text-white/60 font-nunito text-xs font-semibold uppercase tracking-widest">
                                Monthly Budget
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary card — overlaps the hero */}
            <div className="full-bleed">
                <div className="max-w-md mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.3, ease: "easeOut" }}
                        className="-mt-10 bg-white rounded-3xl shadow-xl shadow-indigo-100/60 p-6 space-y-6"
                    >
                        {/* Targets row */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-500 font-quicksand text-sm">
                                    Budget Overview
                                </span>
                                <button
                                    onClick={() => setShowBudgetModal(true)}
                                    className="flex items-center justify-center gap-1.5 font-bold text-[#4ade80] font-quicksand hover:opacity-80 transition-opacity tabular-nums min-h-[44px] px-2 -mr-2"
                                    aria-label="Edit budget target"
                                >
                                    ${budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <Pencil className="w-3.5 h-3.5 opacity-60" />
                                </button>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-[#86EFAC] to-[#4ADE80] rounded-full"
                                />
                            </div>
                        </div>

                        {/* Income row */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-500 font-quicksand text-sm">
                                        Monthly Income
                                    </span>
                                    <button
                                        onClick={() => setShowIncomeModal(true)}
                                        className="w-11 h-11 -ml-2 -my-2 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label="Edit monthly income"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="font-bold text-gray-800 font-quicksand tabular-nums">
                                    ${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Budget Allocations */}
            <div className="px-4 mt-0">
                <BudgetTab workspaceId={activeWorkspaceId} />

                <div className="mt-8">
                    {isPremium ? (
                        <RecurringTab workspaceId={activeWorkspaceId} />
                    ) : (
                        <PremiumRecurringGate />
                    )}
                </div>
            </div>

            <SetBudgetModal
                workspaceId={activeWorkspaceId}
                isOpen={showBudgetModal}
                onClose={() => setShowBudgetModal(false)}
                currentBudget={budget}
            />

            <SetIncomeModal
                userId={user._id}
                isOpen={showIncomeModal}
                onClose={() => setShowIncomeModal(false)}
                currentIncome={income}
            />
        </div>
    );
}

function PremiumRecurringGate() {
    return (
        <div className="rounded-2xl border-2 border-dashed border-indigo-100 bg-indigo-50/50 p-6 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="font-bold font-quicksand text-gray-700 mb-1">Recurring Expenses</h3>
            <p className="text-sm text-gray-400 font-nunito mb-4 text-pretty">
                Track subscriptions and fixed costs to know your true monthly baseline.
            </p>
            <button className="bg-[#4F46E5] text-white text-sm font-bold font-nunito px-6 py-3 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity active:scale-95">
                Upgrade to Premium
            </button>
        </div>
    );
}
