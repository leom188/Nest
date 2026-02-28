"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SwipeableExpenseCard } from "../ui/SwipeableExpenseCard";
import { Expense, useUIStore } from "../../stores/uiStore";
import { Id } from "../../../convex/_generated/dataModel";

interface ExpenseHistoryProps {
    expenses: Expense[];
    workspaceId: Id<"workspaces">;
    defaultOpen?: boolean;
}

const PAGE_SIZE = 20;

export function ExpenseHistory({ expenses, workspaceId, defaultOpen = false }: ExpenseHistoryProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const { openAddExpenseModal } = useUIStore();

    if (expenses.length === 0) return null;

    const visibleExpenses = expenses.slice(0, visibleCount);
    const hasMore = visibleCount < expenses.length;

    const handleEdit = (expense: Expense) => {
        openAddExpenseModal(expense);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header / toggle */}
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-4 text-left"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2">
                    <span className="font-bold font-quicksand text-gray-800">
                        All Expenses
                    </span>
                    <span className="text-xs font-semibold font-nunito text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        {expenses.length}
                    </span>
                </div>
                {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
            </button>

            {/* Collapsible content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="px-2 pb-2 space-y-1.5">
                            {visibleExpenses.map((expense) => (
                                <SwipeableExpenseCard
                                    key={expense._id}
                                    expense={{ ...expense, workspaceId }}
                                    onEdit={handleEdit}
                                />
                            ))}

                            {hasMore && (
                                <button
                                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                                    className="mt-2 w-full py-3 text-sm font-semibold font-nunito text-otter-blue bg-otter-blue/5 rounded-2xl hover:bg-otter-blue/10 transition-colors active:scale-[0.98]"
                                >
                                    Show more ({expenses.length - visibleCount} remaining)
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
