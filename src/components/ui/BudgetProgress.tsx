"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

interface BudgetProgressProps {
    workspaceId: Id<"workspaces">;
}

export function BudgetProgress({ workspaceId }: BudgetProgressProps) {

    const workspaceBudget = useQuery(api.workspaces.getWorkspaceBudget, {
        workspaceId,
    });

    const monthlySpending = useQuery(api.expenses.getMonthlySpending, {
        workspaceId,
    });

    const budget = workspaceBudget?.monthlyBudget ?? 0;
    const spent = monthlySpending ?? 0;
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = percentUsed > 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-otter shadow-soft p-6"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-otter-lavender/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-otter-lavender" />
                </div>
                <h2 className="text-lg font-bold font-quicksand text-gray-800">
                    Budget Progress
                </h2>
            </div>

            {budget > 0 ? (
                <div className="space-y-4">
                    <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
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
                        {percentUsed > 100 && (
                            <div
                                className="absolute top-0 left-0 h-full rounded-full bg-otter-pink opacity-50"
                                style={{ width: "100%" }}
                            />
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 font-nunito">
                                Spent
                            </p>
                            <p className="text-xl font-bold font-quicksand text-gray-800">
                                ${spent.toFixed(2)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-400 font-nunito">
                                Budget
                            </p>
                            <p className="text-xl font-bold font-quicksand text-gray-700">
                                ${budget.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400 font-nunito">
                                Remaining
                            </span>
                            <span className={`font-bold font-quicksand ${isOverBudget ? "text-otter-pink" : "text-otter-mint"
                                }`}>
                                {isOverBudget ? "-" : ""}${Math.abs(budget - spent).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-xl">
                    <p className="text-gray-400 font-nunito text-center">
                        💰 Set a budget in Plan to track progress
                    </p>
                </div>
            )}
        </motion.div>
    );
}
