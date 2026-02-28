"use client";

import { Edit2 } from "lucide-react";

interface BudgetLimitRowProps {
    category: string;
    emoji: string;
    limit: number;
    onEdit: () => void;
}

export function BudgetLimitRow({ category, emoji, limit, onEdit }: BudgetLimitRowProps) {
    return (
        <div className="flex items-center justify-between py-3 px-4 bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{emoji}</span>
                <span className="font-semibold font-quicksand text-gray-800">{category}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="font-bold font-quicksand text-gray-700 tabular-nums">
                    {limit > 0
                        ? `$${limit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : <span className="text-gray-300 font-normal text-sm">No limit</span>
                    }
                </span>
                <button
                    onClick={onEdit}
                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-otter-blue hover:bg-otter-blue/5 rounded-xl transition-colors"
                    aria-label={`Edit limit for ${category}`}
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
