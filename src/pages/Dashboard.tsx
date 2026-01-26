"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useLocation } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ArrowRightLeft, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { ContextBar } from "../components/ContextBar";
import { InvitePartnerPrompt } from "../components/InvitePartnerPrompt";
import { ContextualEmptyState } from "../components/ContextualEmptyState";
import { SwipeableExpenseCard } from "../components/ui/SwipeableExpenseCard";
import { useAuthStore } from "../stores/authStore";
import { useUIStore, Expense } from "../stores/uiStore";
import { Celebration } from "../components/Celebration";

interface DashboardProps {
    workspaceId: Id<"workspaces">;
    onWorkspaceSelect?: (workspaceId: string) => void;
    onCreateWorkspace?: () => void;
}
// ... interface definitions ...

interface MemberWithUser {
    userId: string;
    role: string;
    user: {
        _id: string;
        name?: string;
        email?: string;
    };
}



export function Dashboard({ workspaceId, onWorkspaceSelect, onCreateWorkspace }: DashboardProps) {
    const { user } = useAuthStore();
    const { openAddExpenseModal } = useUIStore();
    // const [showAddExpense, setShowAddExpense] = useState(false); // Removed
    const [justAddedExpense, setJustAddedExpense] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const location = useLocation();

    // editingExpense state moved to uiStore

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

    const totalThisMonth = stats?.totalSpent || 0;
    const expenseCount = expenses?.length || 0;
    const budget = workspace?.monthlyBudget || 0;

    useEffect(() => {
        if (location.state?.openExpenseModal) {
            openAddExpenseModal();
        }
    }, [location.state]);

    useEffect(() => {
        if (expenseCount > 0 && justAddedExpense) {
            setJustAddedExpense(false);
            setShowCelebration(true);
        }
    }, [expenseCount, justAddedExpense]);

    // Check if user has dismissed the invite prompt for this workspace
    const [dismissedInvite, setDismissedInvite] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`hasDismissedInvite_${workspaceId}`) === 'true';
        }
        return false;
    });

    const handleDismissInvite = () => {
        localStorage.setItem(`hasDismissedInvite_${workspaceId}`, 'true');
        setDismissedInvite(true);
    };

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

    const handleEditExpense = (expense: Expense) => {
        openAddExpenseModal(expense);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <ContextBar
                type={workspace.type}
                workspaceName={workspace.name}
                onWorkspaceSelect={onWorkspaceSelect}
                onCreateWorkspace={onCreateWorkspace}
                currentWorkspaceId={workspaceId}
                membersCount={workspace.members.length}
            />

            <div className="flex-1 p-4 pb-24 safe-x">
                {isSoloSharedWorkspace && !dismissedInvite && (
                    <div className="mb-6">
                        <InvitePartnerPrompt
                            workspaceId={workspaceId}
                            workspaceName={workspace.name}
                            workspaceType={workspace.type as "split" | "joint"}
                            onDismiss={handleDismissInvite}
                        />
                    </div>
                )}

                <div className="mb-8">
                    {workspace.type === "personal" && (
                        <PersonalHeroContent
                            total={totalThisMonth}
                            budget={budget}
                            expenseCount={expenseCount}
                        />
                    )}

                    {workspace.type === "split" && (
                        <SplitHeroContent
                            partnerName={workspace.members.find((m: MemberWithUser) => m.userId !== user?._id)?.user?.name}
                            myBalance={stats?.myBalance || 0}
                        />
                    )}

                    {workspace.type === "joint" && (
                        <JointHeroContent
                            budget={workspace.monthlyBudget || workspace.monthlyTarget || 0}
                            spent={totalThisMonth}
                        />
                    )}
                </div>

                {expenses && expenses.length > 0 ? (
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold font-quicksand text-gray-800 mb-3">
                            Recent Expenses
                        </h3>
                        {expenses.map((expense: Expense) => (
                            <SwipeableExpenseCard
                                key={expense._id}
                                expense={{ ...expense, workspaceId }}
                                onEdit={handleEditExpense}
                            />
                        ))}
                    </div>
                ) : (
                    <ContextualEmptyState
                        workspaceType={workspace.type}
                        onAddExpense={() => openAddExpenseModal()}
                    />
                )}


            </div>



            {/* Floating Action Button for Adding Expense */}
            {/* Floating Action Button for Adding Expense */}
            <div className="fixed bottom-24 left-0 right-0 z-40 pointer-events-none safe-x">
                <div className="max-w-md mx-auto relative w-full px-4">
                    <button
                        onClick={() => openAddExpenseModal()}
                        className="absolute right-4 bottom-0 pointer-events-auto w-14 h-14 bg-otter-blue hover:bg-otter-blue/90 text-white rounded-full shadow-lg shadow-otter-blue/30 flex items-center justify-center transition-all active:scale-95"
                        aria-label="Add Expense"
                    >
                        <Plus className="w-8 h-8" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <Celebration
                show={showCelebration}
                message={workspace.type === "personal"
                    ? "Your first expense has been logged!"
                    : workspace.type === "split"
                        ? "Your first shared expense has been added!"
                        : "Your first common pot expense is in!"}
                onComplete={() => setShowCelebration(false)}
            />
        </div>
    );
}

function PersonalHeroContent({
    total,
    budget,
    expenseCount,
}: {
    total: number;
    budget: number;
    expenseCount: number;
}) {
    const totalPercentage = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
    const isOverBudget = total > budget && budget > 0;

    return (
        <div className="bg-gradient-to-br from-otter-blue to-otter-fresh rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

            <div className="relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-otter-blue-100 font-nunito text-sm mb-1">Total Spent</p>
                        <h3 className="text-3xl font-bold font-quicksand">${total.toFixed(2)}</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-otter-blue-100 font-nunito text-sm mb-1">Monthly Limit</p>
                        <p className="text-xl font-bold font-quicksand">
                            {budget > 0 ? `$${budget.toFixed(2)}` : "No Limit"}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${isOverBudget ? "bg-otter-pink" : "bg-white"}`}
                    />
                </div>

                {isOverBudget && (
                    <p className="text-white/90 font-bold text-sm mt-3 flex items-center gap-1 bg-otter-pink/20 py-1 px-3 rounded-lg w-fit">
                        ⚠️ Over budget by ${(total - budget).toFixed(2)}
                    </p>
                )}

                {!isOverBudget && budget > 0 && (
                    <p className="text-white/80 text-sm mt-3 font-nunito">
                        ${(budget - total).toFixed(2)} remaining
                    </p>
                )}

                {!budget && (
                    <p className="text-white/80 text-sm mt-3 font-nunito">
                        Tracking {expenseCount} expense{expenseCount !== 1 ? "s" : ""}
                    </p>
                )}
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
    budget,
    spent,
}: {
    budget: number;
    spent: number;
}) {
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const isOverBudget = spent > budget && budget > 0;

    return (
        <div className="bg-gradient-to-br from-otter-blue to-otter-fresh rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

            <div className="relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-white/80 font-nunito text-sm mb-1">Total Spent</p>
                        <h3 className="text-3xl font-bold font-quicksand">${spent.toFixed(2)}</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-white/80 font-nunito text-sm mb-1">Monthly Budget</p>
                        <p className="text-xl font-bold font-quicksand">
                            {budget > 0 ? `$${budget.toFixed(2)}` : "No Limit"}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${isOverBudget ? "bg-otter-pink" : "bg-white"}`}
                    />
                </div>

                {isOverBudget && (
                    <p className="text-white/90 font-bold text-sm mt-3 flex items-center gap-1 bg-otter-pink/20 py-1 px-3 rounded-lg w-fit">
                        ⚠️ Over budget by ${(spent - budget).toFixed(2)}
                    </p>
                )}

                {!isOverBudget && budget > 0 && (
                    <p className="text-white/80 text-sm mt-3 font-nunito">
                        ${(budget - spent).toFixed(2)} remaining in the pot
                    </p>
                )}
            </div>
        </div>
    );
}
