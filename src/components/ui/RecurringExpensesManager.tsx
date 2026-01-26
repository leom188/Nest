"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthStore } from "../../stores/authStore";

interface RecurringExpensesManagerProps {
    workspaceId: Id<"workspaces">;
}

interface RecurringExpense {
    _id: Id<"expenses">;
    description: string;
    amount: number;
    category: string;
    date: number;
    recurrenceRule?: string;
    payer?: { name?: string } | null;
}

export function RecurringExpensesManager({
    workspaceId,
}: RecurringExpensesManagerProps) {
    const { user } = useAuthStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const recurringExpenses = useQuery(api.expenses.getRecurringExpenses, {
        workspaceId,
    });

    const deleteExpense = useMutation(api.expenses.deleteExpense);

    const formatFrequency = (rule?: string) => {
        if (!rule) return "Monthly";
        if (rule.includes("FREQ=WEEKLY")) return "Weekly";
        if (rule.includes("FREQ=YEARLY")) return "Yearly";
        return "Monthly";
    };

    const formatNextDate = (date: number) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="bg-white rounded-otter shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-otter-coral/10 rounded-xl flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-otter-coral"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold font-quicksand text-gray-800">
                            Recurring Expenses
                        </h2>
                        <p className="text-sm text-gray-400 font-nunito">
                            Subscriptions & bills
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAddingNew(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-otter-blue/10 text-otter-blue hover:bg-otter-blue/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {isAddingNew && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-dashed border-otter-lavender/30">
                    <p className="text-sm text-gray-500 font-nunito">
                        Use the + button on the Add Expense modal to mark an expense as recurring
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingNew(false)}
                        className="mt-2"
                    >
                        Got it
                    </Button>
                </div>
            )}

            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                >
                    {recurringExpenses && recurringExpenses.length > 0 ? (
                        recurringExpenses.map((expense: RecurringExpense) => (
                            <div
                                key={expense._id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{expense.category}</span>
                                        <span className="px-2 py-0.5 text-xs bg-otter-lavender/20 text-otter-lavender rounded-full font-medium">
                                            {formatFrequency(expense.recurrenceRule)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 font-nunito truncate">
                                        {expense.description}
                                    </p>
                                    <p className="text-xs text-gray-400 font-nunito">
                                        Next: {formatNextDate(expense.date)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold font-quicksand text-gray-800">
                                        ${expense.amount.toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => {
                                            if (user) {
                                                deleteExpense({
                                                    expenseId: expense._id,
                                                });
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-otter-pink hover:bg-otter-pink/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-gray-400 font-nunito mb-4">
                                No recurring expenses yet
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            {!isExpanded && recurringExpenses && recurringExpenses.length > 0 && (
                <div className="py-2 text-center">
                    <p className="text-sm text-gray-500 font-nunito">
                        {recurringExpenses.length} recurring expense
                        {recurringExpenses.length !== 1 ? "s" : ""} • $
                        {recurringExpenses
                            .reduce((sum: number, e: RecurringExpense) => sum + e.amount, 0)
                            .toFixed(2)}{" "}
                        / month
                    </p>
                </div>
            )}
        </div>
    );
}
