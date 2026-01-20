"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Wallet, Edit2, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { SetBudgetModal } from "../components/ui/SetBudgetModal";
import { RecurringExpensesManager } from "../components/ui/RecurringExpensesManager";

interface PlanPageProps {
    workspaceId: Id<"workspaces">;
}

export function PlanPage({ workspaceId }: PlanPageProps) {
    const [showBudgetModal, setShowBudgetModal] = useState(false);

    const workspaceBudget = useQuery(api.workspaces.getWorkspaceBudget, {
        workspaceId,
    });

    const monthlySpending = useQuery(api.expenses.getMonthlySpending, {
        workspaceId,
    });

    const budget = workspaceBudget?.monthlyBudget ?? 0;
    const spent = monthlySpending ?? 0;
    const remaining = budget - spent;
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = remaining < 0;

    return (
        <div className="min-h-screen bg-otter-white safe-all pb-24">
            <PageHeader title="Plan" />

            <div className="p-4 space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-otter shadow-soft p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-otter-blue/10 rounded-xl flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-otter-blue" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold font-quicksand text-gray-800">
                                    Monthly Budget
                                </h2>
                                <p className="text-sm text-gray-400 font-nunito">
                                    {budget > 0 ? `${percentUsed.toFixed(0)}% spent` : "Set a spending limit"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowBudgetModal(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-otter-blue/10 text-otter-blue hover:bg-otter-blue/20 transition-colors"
                        >
                            {budget > 0 ? (
                                <Edit2 className="w-4 h-4" />
                            ) : (
                                <span className="text-lg font-bold">+</span>
                            )}
                        </button>
                    </div>

                    {budget > 0 ? (
                        <div className="space-y-4">
                            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(percentUsed, 100)}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className={`absolute top-0 left-0 h-full rounded-full ${isOverBudget
                                        ? "bg-otter-pink"
                                        : percentUsed > 75
                                            ? "bg-otter-coral"
                                            : "bg-otter-mint"
                                        }`}
                                />
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 font-nunito">
                                        Spent this month
                                    </p>
                                    <p className="text-2xl font-bold font-quicksand text-gray-800">
                                        ${spent.toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400 font-nunito">
                                        {isOverBudget ? "Over budget" : "Remaining"}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {isOverBudget ? (
                                            <TrendingUp className="w-4 h-4 text-otter-pink" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-otter-mint" />
                                        )}
                                        <p
                                            className={`text-xl font-bold font-quicksand ${isOverBudget ? "text-otter-pink" : "text-otter-mint"
                                                }`}
                                        >
                                            ${Math.abs(remaining).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400 font-nunito">
                                        Budget
                                    </span>
                                    <span className="font-bold font-quicksand text-gray-700">
                                        ${budget.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowBudgetModal(true)}
                            className="w-full py-4 border-2 border-dashed border-otter-blue/30 rounded-xl text-otter-blue font-bold hover:border-otter-blue/50 hover:bg-otter-blue/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">+</span>
                            Set Budget
                        </button>
                    )}
                </motion.div>

                <RecurringExpensesManager workspaceId={workspaceId} />


            </div>

            <SetBudgetModal
                workspaceId={workspaceId}
                isOpen={showBudgetModal}
                onClose={() => setShowBudgetModal(false)}
                currentBudget={budget}
            />
        </div>
    );
}
