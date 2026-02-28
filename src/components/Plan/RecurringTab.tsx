"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Plus, Trash2, Calendar } from "lucide-react";
import { AddRecurringModal } from "./AddRecurringModal";

interface RecurringTabProps {
    workspaceId: Id<"workspaces">;
}

export function RecurringTab({ workspaceId }: RecurringTabProps) {
    const expenses = useQuery(api.recurring.getRecurring, { workspaceId });
    const deleteRecurring = useMutation(api.recurring.deleteRecurring);

    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!expenses) {
        return <div className="p-4 text-center text-gray-400">Loading subscriptions...</div>;
    }

    const totalMonthly = expenses.reduce((sum, e) => {
        return sum + (e.interval === "yearly" ? e.amount / 12 : e.amount);
    }, 0);

    return (
        <div>
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-otter-lavender/10 to-otter-blue/5 rounded-2xl p-6 mb-4 border border-otter-lavender/20">
                <p className="text-sm font-bold text-otter-lavender uppercase tracking-widest mb-1">
                    Fixed Monthly Costs
                </p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-quicksand text-gray-800">
                        ${totalMonthly.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 font-nunito">/ month</span>
                </div>
            </div>

            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold font-quicksand text-gray-800">Bills & Subscriptions</h2>
                <Button onClick={() => setIsModalOpen(true)} size="sm" className="bg-otter-blue text-white rounded-xl">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Bill
                </Button>
            </div>

            {expenses.length > 0 ? (
                <div className="space-y-3">
                    {expenses.map((expense) => (
                        <div key={expense._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-otter-lavender/10 rounded-full flex items-center justify-center text-xl">
                                    {/* Placeholder icon logic based on category name could go here */}
                                    📱
                                </div>
                                <div>
                                    <h3 className="font-bold font-quicksand text-gray-800">{expense.label}</h3>
                                    <p className="text-xs text-gray-400 font-nunito flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {expense.interval === "monthly" ? "Monthly" : "Yearly"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold font-quicksand text-gray-700">
                                    ${expense.amount.toFixed(2)}
                                </span>
                                <button
                                    onClick={() => deleteRecurring({ id: expense._id })}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <h3 className="font-bold text-gray-700 font-quicksand mb-2">📅 Track your recurring costs</h3>
                    <p className="text-gray-500 font-nunito mb-4 text-sm text-balance">
                        Add rent, streaming, gym — anything that repeats monthly or yearly.
                    </p>
                    <Button onClick={() => setIsModalOpen(true)} size="sm" className="bg-otter-blue text-white rounded-xl">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Bill
                    </Button>
                </div>
            )}

            <AddRecurringModal
                workspaceId={workspaceId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
