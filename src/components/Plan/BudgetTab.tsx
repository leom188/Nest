"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Plus } from "lucide-react";
import { BudgetProgress } from "./BudgetProgress";
import { SetCategoryBudgetModal } from "./SetCategoryBudgetModal";

import { Button } from "../ui/button";

interface BudgetTabProps {
    workspaceId: Id<"workspaces">;
}

export function BudgetTab({ workspaceId }: BudgetTabProps) {
    const spending = useQuery(api.expenses.getSpendingByCategory, { workspaceId });
    const budgets = useQuery(api.budgets.getBudgets, { workspaceId });
    const categories = useQuery(api.expenses.getCategories);
    const workspaceFn = useQuery(api.workspaces.getWorkspaceById, { workspaceId });
    const workspaceBudgetFn = useQuery(api.workspaces.getWorkspaceBudget, { workspaceId });
    const workspaceStats = useQuery(api.workspaces.getWorkspaceStats, { workspaceId });

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<{ category: string; limit: number } | undefined>(undefined);

    const handleEditCategory = (category: string, limit: number) => {
        setEditingCategory({ category, limit });
        setIsCategoryModalOpen(true);
    };

    const handleAddCategory = () => {
        setEditingCategory(undefined);
        setIsCategoryModalOpen(true);
    };

    if (!spending || !budgets || !categories || !workspaceFn || !workspaceBudgetFn || !workspaceStats) {
        return <div className="p-4 text-center text-gray-400">Loading budgets...</div>;
    }

    // Logic to determine if Total Budget card should be shown
    // Show for Personal and Joint. Hide for Split.
    // const showTotalBudget = workspaceFn.type !== "split"; // REMOVED

    // const totalBudget = workspaceBudgetFn.monthlyBudget;
    // const totalSpent = workspaceStats.totalSpent;

    // Merge spending and budgets for categories
    const budgetMap = new Map(budgets.map((b) => [b.category, b.limit]));
    const spendingMap = new Map(spending.map((s) => [s.name, s.amount]));

    const allCategories = new Set([...budgetMap.keys(), ...spendingMap.keys()]);
    const emojiMap = new Map(categories.map((c: any) => [c.name, c.emoji]));

    const items = Array.from(allCategories).map((catName) => ({
        category: catName,
        limit: budgetMap.get(catName) || 0,
        spent: spendingMap.get(catName) || 0,
        emoji: emojiMap.get(catName) || "💸",
    })).sort((a, b) => {
        const aPercent = a.limit > 0 ? a.spent / a.limit : (a.spent > 0 ? 1000 : 0);
        const bPercent = b.limit > 0 ? b.spent / b.limit : (b.spent > 0 ? 1000 : 0);
        return bPercent - aPercent;
    });

    const activeBudgets = items.filter(i => i.limit > 0);
    const noBudgetItems = items.filter(i => i.limit === 0 && i.spent > 0);

    return (
        <div className="pb-24">


            <div className="flex items-center justify-between mb-4 mt-8">
                <div>
                    <h2 className="text-lg font-bold font-quicksand text-gray-800">Category Allocations</h2>
                    <p className="text-sm text-gray-400 font-nunito">Breakdown by category</p>
                </div>
                <Button onClick={handleAddCategory} size="sm" className="bg-otter-blue text-white rounded-xl">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Category
                </Button>
            </div>

            {activeBudgets.length > 0 ? (
                <div className="space-y-4">
                    {activeBudgets.map((item) => (
                        <BudgetProgress
                            key={item.category}
                            category={item.category}
                            limit={item.limit}
                            spent={item.spent}
                            emoji={item.emoji}
                            onEdit={() => handleEditCategory(item.category, item.limit)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-100 mb-6">
                    <p className="text-gray-500 font-nunito mb-2">No category budgets set.</p>
                </div>
            )}

            {noBudgetItems.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Unbudgeted Spending</h3>
                    <div className="space-y-4">
                        {noBudgetItems.map((item) => (
                            <BudgetProgress
                                key={item.category}
                                category={item.category}
                                limit={0}
                                spent={item.spent}
                                emoji={item.emoji}
                                onEdit={() => handleEditCategory(item.category, 0)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <SetCategoryBudgetModal
                workspaceId={workspaceId}
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                initialCategory={editingCategory?.category}
                initialLimit={editingCategory?.limit}
            />


        </div>
    );
}
