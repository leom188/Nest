"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { ChevronLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SetBudgetModal } from "../components/ui/SetBudgetModal";
import { SetIncomeModal } from "../components/Plan/SetIncomeModal";
import { BudgetTab } from "../components/Plan/BudgetTab";
import { RecurringTab } from "../components/Plan/RecurringTab";


interface PlanProps {
    workspaceId: Id<"workspaces">;
}

export function Plan({ workspaceId }: PlanProps) {
    const navigate = useNavigate();
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);

    // If workspaceId is not passed from props (e.g. initial load logic from old Plan.tsx), fetch it
    // But since App.tsx passes it now, we rely on props.
    // However, to be safe and robust if called without props (though it shouldn't be):
    const workspaces = useQuery(api.workspaces.getWorkspacesForUser);
    const activeWorkspaceId = workspaceId || workspaces?.[0]?._id;

    const user = useQuery(api.users.current);
    const budgetFn = useQuery(api.budgets.getBudgets, activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip");
    const recurringFn = useQuery(api.recurring.getRecurring, activeWorkspaceId ? { workspaceId: activeWorkspaceId } : "skip");

    // Calculate dynamic budget strategy:
    // 1. If a category has a set Budget (Allocations), use that as the total plan for that category.
    // 2. If a category has NO set Budget, but has Recurring Expenses, use the sum of those expenses.
    // This prevents double counting (e.g. Rent budget $2000 + Rent recurring $2000 should = $2000, not $4000)

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

        // Use allocation if set (> 0), otherwise use recurring sum
        // If both are 0, adds 0.
        if (allocated > 0) {
            totalBudget += allocated;
        } else {
            totalBudget += recurring;
        }
    });

    // "Cost to Be Me"
    const budget = totalBudget;
    const income = user?.income ?? 0;

    // Percentage for progress bars
    const budgetPercent = income > 0 ? (budget / income) * 100 : 0;
    const monthName = new Date().toLocaleString("default", { month: "long" });

    if (!user || !activeWorkspaceId) {
        return <div className="min-h-screen bg-otter-white flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-otter-white pb-24">
            {/* Header Section */}
            <div className="bg-[#4F46E5] pt-12 pb-32 px-6 relative rounded-b-[40px] shadow-lg shadow-indigo-200/50">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate("/")}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold font-quicksand text-white">
                        Edit Plan
                    </h1>
                    <div className="w-12" /> {/* Spacer */}
                </div>

                <div className="text-center">
                    <h2 className="text-5xl font-bold font-quicksand text-white mb-2 tracking-tight">
                        ${budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-white/80 font-nunito text-lg font-medium">
                        Cost to Be Me
                    </p>
                </div>
            </div>

            {/* Comparison Card */}
            <div className="px-6 -mt-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-[32px] shadow-xl shadow-gray-200/60 p-6 space-y-8"
                >
                    {/* Targets Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-500 font-quicksand">
                                {monthName}'s Targets
                            </span>
                            <button
                                onClick={() => setShowBudgetModal(true)}
                                className="font-bold text-[#4ade80] font-quicksand hover:opacity-80 transition-opacity"
                            >
                                ${budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </button>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[#86EFAC] to-[#4ADE80] rounded-full"
                            />
                        </div>
                    </div>

                    {/* Income Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-500 font-quicksand">
                                    Monthly Income
                                </span>
                                <button
                                    onClick={() => setShowIncomeModal(true)}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                            <span className="font-bold text-gray-800 font-quicksand">
                                ${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="h-5 bg-[#E5E5E5] rounded-full relative overflow-hidden">
                            {/* Placeholder pattern/texture could go here if needed to look exactly like mockup */}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Budget Allocations */}
            <div className="p-6">
                {/* Re-integrate budget categories without the tabs for now, as the prompt focused on the header. 
                     However, the user likely still needs to manage categories. 
                     I will include the BudgetTab content (categories) below. */}
                <BudgetTab workspaceId={activeWorkspaceId} />

                <div className="mt-8 pt-8 border-t border-gray-100">
                    <RecurringTab workspaceId={activeWorkspaceId} />
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
