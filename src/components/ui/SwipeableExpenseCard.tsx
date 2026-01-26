"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { SwipeableRow } from "./SwipeableRow";
import { toast } from "sonner";

interface Expense {
    _id: string;
    amount: number;
    description: string;
    category: string;
    date: number;
    payer: { name?: string; email?: string } | null;
    workspaceId: Id<"workspaces">;
    isRecurring?: boolean;
    recurrenceRule?: string;
    splitDetails?: Record<Id<"users">, number>;
}

interface SwipeableExpenseCardProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
}

export function SwipeableExpenseCard({ expense, onEdit }: SwipeableExpenseCardProps) {
    const deleteExpense = useMutation(api.expenses.deleteExpense);
    const createExpense = useMutation(api.expenses.createExpense);

    const handleDelete = async () => {
        // Capture all necessary fields for undo
        const { workspaceId, amount, description, category, date, isRecurring, recurrenceRule, splitDetails } = expense;

        try {
            await deleteExpense({
                expenseId: expense._id as Id<"expenses">,
            });

            toast.success("Expense deleted", {
                description: description,
                action: {
                    label: "Undo",
                    onClick: async () => {
                        try {
                            await createExpense({
                                workspaceId,
                                amount,
                                description,
                                category,
                                date,
                                isRecurring: isRecurring || false,
                                recurrenceRule,
                                splitDetails,
                            });
                            toast.success("Expense restored");
                        } catch (err) {
                            console.error("Undo failed:", err);
                            toast.error("Failed to restore expense");
                        }
                    },
                },
            });
        } catch (error) {
            console.error("Failed to delete expense:", error);
            toast.error("Failed to delete expense");
        }
    };

    const config = getCategoryConfig(expense.category);
    const dateStr = new Date(expense.date).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
    });

    return (
        <SwipeableRow
            onLeftSwipe={handleDelete}
            onRightSwipe={() => onEdit(expense)}
            onTap={() => onEdit(expense)}
        >
            <div className="bg-white rounded-otter p-4 flex items-center gap-4 border border-otter-lavender/5 hover:bg-gray-50/50 transition-colors active:scale-[0.99]">
                <div
                    className={`w-12 h-12 ${config.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner flex-shrink-0 transition-transform group-active:scale-95`}
                >
                    {config.emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold font-quicksand text-gray-800 truncate">
                        {expense.description}
                    </p>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400 font-nunito bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                            {dateStr}
                        </p>
                        <span className="text-[10px] text-gray-300">•</span>
                        <p className="text-xs text-gray-400 font-nunito truncate max-w-[100px]">
                            {expense.payer?.name || "Unknown"}
                        </p>
                    </div>
                </div>
                <p className="text-lg font-bold font-quicksand text-otter-blue flex-shrink-0">
                    ${expense.amount.toFixed(2)}
                </p>
            </div>
        </SwipeableRow>
    );
}


function getCategoryConfig(category: string) {
    const configs: Record<string, { emoji: string; color: string }> = {
        groceries: { emoji: "🛒", color: "bg-green-100" },
        dining: { emoji: "🍕", color: "bg-orange-100" },
        utilities: { emoji: "💡", color: "bg-yellow-100" },
        rent: { emoji: "🏠", color: "bg-blue-100" },
        transport: { emoji: "🚗", color: "bg-purple-100" },
        entertainment: { emoji: "🎬", color: "bg-pink-100" },
        health: { emoji: "💊", color: "bg-red-100" },
        shopping: { emoji: "🛍️", color: "bg-indigo-100" },
        subscriptions: { emoji: "📱", color: "bg-cyan-100" },
        other: { emoji: "📦", color: "bg-gray-100" },
    };
    return configs[category] || configs.other;
}
