"use client";

import { motion } from "framer-motion";
import { Edit2 } from "lucide-react";

interface BudgetProgressProps {
    category: string;
    spent: number;
    limit: number;
    onEdit: () => void;
}

export function BudgetProgress({ category, spent, limit, onEdit }: BudgetProgressProps) {
    const percentage = Math.max(0, Math.min((spent / limit) * 100, 100));
    const isOver = spent > limit;

    // Use specific colors for some common categories, fallback to sleek gray/blue
    const getColor = (cat: string) => {
        const map: Record<string, string> = {
            "Food": "text-otter-mint bg-otter-mint",
            "Transport": "text-otter-blue bg-otter-blue",
            "Shopping": "text-otter-lavender bg-otter-lavender",
            "Utilities": "text-amber-500 bg-amber-500",
            "Entertainment": "text-otter-pink bg-otter-pink",
        };
        return map[cat] || "text-gray-500 bg-gray-500";
    };

    const colorClass = isOver ? "text-red-500 bg-red-500" : getColor(category);
    // Split text and bg for detailed usage
    const bgClass = colorClass.split(" ")[1];

    // Determine emoji
    const emoji = category === "Food" ? "🍔" :
        category === "Transport" ? "🚗" :
            category === "Shopping" ? "🛍️" :
                category === "Utilities" ? "💡" :
                    category === "Rent" ? "🏠" : "💸";

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-3">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${bgClass}/10 flex items-center justify-center`}>
                        <span className="text-xl">{emoji}</span>
                    </div>
                    <div>
                        <h3 className="font-bold font-quicksand text-gray-800">{category}</h3>
                        <p className="text-xs text-gray-400 font-nunito">
                            ${spent.toFixed(2)} of ${limit.toFixed(2)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onEdit}
                    className="p-2 text-gray-300 hover:text-otter-blue hover:bg-otter-blue/5 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>

            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${bgClass}`}
                />
            </div>

            {isOver && (
                <p className="text-xs text-red-500 font-bold mt-2 font-nunito flex items-center gap-1">
                    ⚠️ Over budget by ${(spent - limit).toFixed(2)}
                </p>
            )}
        </div>
    );
}
