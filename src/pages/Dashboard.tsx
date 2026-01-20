"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useLocation } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Wallet, ArrowRightLeft } from "lucide-react";
import { ContextBar } from "../components/ContextBar";
import { InvitePartnerPrompt } from "../components/InvitePartnerPrompt";
import { SwipeableExpenseCard } from "../components/ui/SwipeableExpenseCard";
import { AddExpenseModal } from "../components/AddExpenseModal";
import { useAuthStore } from "../stores/authStore";

interface DashboardProps {
    workspaceId: Id<"workspaces">;
    onWorkspaceSelect?: (workspaceId: string) => void;
    onCreateWorkspace?: () => void;
    onWorkspaceSettings?: (workspaceId: string) => void;
}

export function Dashboard({ workspaceId, onWorkspaceSelect, onCreateWorkspace, onWorkspaceSettings }: DashboardProps) {
    const { user } = useAuthStore();
    const location = useLocation();
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [editingExpense, setEditingExpense] = useState<{
        _id: string;
        amount: number;
        description: string;
        category: string;
        date: number;
        isRecurring?: boolean;
    } | null>(null);

    // Check if we should open the expense modal (from FirstWin onboarding)
    useEffect(() => {
        if (location.state?.openExpenseModal) {
            setShowAddExpense(true);
        }
    }, [location.state]);

    const workspace = useQuery(api.workspaces.getWorkspaceWithMembers, {
        workspaceId,
    });

    const expenses = useQuery(api.expenses.getExpensesForWorkspace, {
        workspaceId,
        limit: 50,
    });

    const stats = useQuery(api.workspaces.getWorkspaceStats, {
        workspaceId,
    });

    if (!workspace) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-otter-blue/30 border-t-otter-blue rounded-full animate-spin" />
            </div>
        );
    }

    const isSoloSharedWorkspace =
        (workspace.type === "split" || workspace.type === "joint") &&
        workspace.members.length === 1;

    // Use stats for totals, defaulting to client-side sum if loading (or just 0)
    const totalThisMonth = stats?.totalSpent || 0;
    const expenseCount = expenses?.length || 0;
    const budget = user?.monthlyBudget || 0;
    const budgetDiff = budget - totalThisMonth;

    const handleEditExpense = (expense: {
        _id: string;
        amount: number;
        description: string;
        category: string;
        date: number;
        isRecurring?: boolean;
    }) => {
        setEditingExpense(expense);
        setShowAddExpense(true);
    };

    const handleCloseModal = () => {
        setShowAddExpense(false);
        setEditingExpense(null);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <ContextBar
                type={workspace.type}
                workspaceName={workspace.name}
                onWorkspaceSelect={onWorkspaceSelect}
                onCreateWorkspace={onCreateWorkspace}
                onWorkspaceSettings={onWorkspaceSettings}
                currentWorkspaceId={workspaceId}
            />

            <div className="flex-1 p-4 pb-24 safe-x">
                {isSoloSharedWorkspace && (
                    <div className="mb-6">
                        <InvitePartnerPrompt
                            workspaceId={workspaceId}
                            workspaceName={workspace.name}
                            workspaceType={workspace.type as "split" | "joint"}
                        />
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-otter shadow-soft p-6 mb-4"
                >
                    {workspace.type === "personal" && (
                        <PersonalHeroContent
                            total={totalThisMonth}
                            budget={budget}
                            budgetDiff={budgetDiff}
                            expenseCount={expenseCount}
                        />
                    )}

                    {workspace.type === "split" && (
                        <SplitHeroContent
                            partnerName={workspace.members.find((m: any) => m.userId !== user?._id)?.user?.name}
                            myBalance={stats?.myBalance || 0}
                        />
                    )}

                    {workspace.type === "joint" && (
                        <JointHeroContent
                            monthlyTarget={workspace.monthlyTarget || 0}
                            spent={totalThisMonth}
                        />
                    )}
                </motion.div>

                {expenses && expenses.length > 0 ? (
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold font-quicksand text-gray-800 mb-3">
                            Recent Expenses
                        </h3>
                        {expenses.map((expense: any) => (
                            <SwipeableExpenseCard
                                key={expense._id}
                                expense={{ ...expense, workspaceId }}
                                onEdit={handleEditExpense}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-otter shadow-soft p-8 text-center"
                    >
                        <div className="w-16 h-16 bg-otter-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-otter-blue" />
                        </div>
                        <h3 className="text-xl font-bold font-quicksand text-gray-800 mb-2">
                            No expenses yet
                        </h3>
                        <p className="text-gray-500 font-nunito">
                            Tap the + button below to add your first expense
                        </p>
                    </motion.div>
                )}
            </div>

            <AddExpenseModal
                workspaceId={workspaceId}
                isOpen={showAddExpense}
                onClose={handleCloseModal}
                editingExpense={editingExpense}
            />
        </div>
    );
}

function PersonalHeroContent({
    total,
    budget,
    budgetDiff,
    expenseCount,
}: {
    total: number;
    budget: number;
    budgetDiff: number;
    expenseCount: number;
}) {
    const hasBudget = budget > 0;
    const isOverBudget = budgetDiff < 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-400 font-nunito uppercase tracking-widest mb-1">
                        Monthly Spending
                    </p>
                    <p className="text-4xl font-bold font-quicksand text-otter-blue">
                        ${total.toFixed(2)}
                    </p>
                </div>
                <div className="w-16 h-16 bg-otter-blue/10 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img
                        src="/icons/logo.png"
                        alt="Nest Mascot"
                        className="w-12 h-12 object-contain"
                    />
                </div>
            </div>

            <div
                className={`p-4 rounded-xl flex items-start gap-3 ${isOverBudget ? "bg-otter-pink/10" : "bg-otter-mint/10"
                    }`}
            >
                <div
                    className={`p-2 rounded-lg ${isOverBudget ? "bg-otter-pink/20" : "bg-otter-mint/20"
                        }`}
                >
                    {isOverBudget ? (
                        <TrendingUp className={`w-5 h-5 text-otter-pink`} />
                    ) : (
                        <TrendingDown className={`w-5 h-5 text-otter-mint`} />
                    )}
                </div>
                <p className="text-sm font-bold font-nunito leading-tight">
                    {hasBudget ? (
                        isOverBudget ? (
                            <span className="text-otter-pink">
                                You've exceeded your budget by ${Math.abs(budgetDiff).toFixed(2)}
                            </span>
                        ) : (
                            <span className="text-otter-mint">
                                You're ${budgetDiff.toFixed(2)} under budget! Keep it up! 🎉
                            </span>
                        )
                    ) : (
                        <span className="text-gray-600">
                            Tracking {expenseCount} expense{expenseCount !== 1 ? "s" : ""} so far this month.
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}

function SplitHeroContent({
    partnerName,
    myBalance = 0,
}: {
    partnerName?: string;
    myBalance?: number;
}) {
    // myBalance > 0: I am owed money.
    // myBalance < 0: I owe money.
    const owesAmount = myBalance;

    return (
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-otter-mint/10 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-otter-mint" />
            </div>
            <div className="flex-1">
                <p className="text-sm text-gray-400 font-nunito uppercase tracking-wide mb-1">
                    Settlement Status
                </p>
                <p className="text-3xl font-bold font-quicksand text-gray-800">
                    ${Math.abs(owesAmount).toFixed(2)}
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-otter-mint/10 text-otter-mint font-bold text-sm rounded-full">
                    {owesAmount === 0
                        ? "All settled up ✓"
                        : owesAmount > 0
                            ? `${partnerName || "Partner"} owes you`
                            : `You owe ${partnerName || "Partner"}`}
                </span>
            </div>
        </div>
    );
}

function JointHeroContent({
    monthlyTarget,
    spent,
}: {
    monthlyTarget: number;
    spent: number;
}) {
    const remaining = monthlyTarget - spent;
    const percentage = monthlyTarget > 0 ? (spent / monthlyTarget) * 100 : 0;

    return (
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-otter-lavender/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-otter-lavender" />
            </div>
            <div className="flex-1">
                <p className="text-sm text-gray-400 font-nunito uppercase tracking-wide mb-1">
                    Bag Balance
                </p>
                <p className="text-3xl font-bold font-quicksand text-gray-800">
                    ${remaining.toFixed(2)}
                </p>
                <div className="mt-3">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${percentage > 100 ? "bg-otter-pink" : "bg-otter-lavender"
                                }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-400 font-nunito mt-1">
                        ${spent.toFixed(2)} of ${monthlyTarget.toFixed(2)} spent
                    </p>
                </div>
            </div>
        </div>
    );
}
