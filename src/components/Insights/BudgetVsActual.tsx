"use client";

import { motion } from "framer-motion";

interface BudgetVsActualItem {
    category: string;
    name: string;
    emoji: string;
    limit: number;
    spent: number;
}

interface BudgetVsActualProps {
    data: BudgetVsActualItem[];
}

function barStyle(pct: number, over: boolean) {
    if (over) return {
        gradient: "linear-gradient(90deg, #F87171, #EF4444)",
        glow: "0 0 10px rgba(239, 68, 68, 0.35)",
        text: "text-red-500",
        badge: "bg-red-500",
    };
    if (pct >= 80) return {
        gradient: "linear-gradient(90deg, #F59E0B, #FBBF24)",
        glow: "0 0 8px rgba(245, 158, 11, 0.3)",
        text: "text-amber-500",
        badge: "bg-amber-500",
    };
    return {
        gradient: "linear-gradient(90deg, #6366F1, #818CF8)",
        glow: "0 0 8px rgba(99, 102, 241, 0.3)",
        text: "text-indigo-600",
        badge: "bg-indigo-500",
    };
}

function BudgetRow({ item, delay }: { item: BudgetVsActualItem; delay: number }) {
    const rawPct = item.limit > 0 ? (item.spent / item.limit) * 100 : 0;
    const displayPct = Math.min(rawPct, 100);
    const isOver = item.spent > item.limit;
    const style = barStyle(displayPct, isOver);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            className="py-3"
        >
            {/* Top row: emoji + name | spent / limit */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base flex-shrink-0">{item.emoji}</span>
                    <span className="text-sm font-semibold font-quicksand text-gray-700 truncate">
                        {item.name}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {/* Percentage pill — inline, never overlaps */}
                    <span className={`text-[11px] font-bold font-nunito px-2 py-0.5 rounded-full text-white ${style.badge}`}>
                        {Math.round(rawPct)}%
                    </span>
                    <span className={`text-sm font-bold font-nunito tabular-nums ${style.text}`}>
                        ${item.spent.toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-400 font-nunito tabular-nums">
                        / ${item.limit.toFixed(0)}
                    </span>
                </div>
            </div>

            {/* Bar track */}
            <div className="relative h-[10px] rounded-full bg-gray-100" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)" }}>
                {/* Animated fill — no floating badge on the bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${displayPct}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: delay + 0.1 }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                        background: style.gradient,
                        boxShadow: style.glow,
                    }}
                />
            </div>

            {/* Over-budget warning */}
            {isOver && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: delay + 0.5 }}
                    className="text-[11px] text-red-500 font-bold font-nunito mt-1.5 flex items-center gap-1"
                >
                    <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: 1 }}
                    >
                        ⚠️
                    </motion.span>
                    Over by ${(item.spent - item.limit).toFixed(0)}
                </motion.p>
            )}
        </motion.div>
    );
}

export function BudgetVsActual({ data }: BudgetVsActualProps) {
    const budgetedItems = data.filter((d) => d.limit > 0);

    if (budgetedItems.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold font-quicksand text-gray-800 text-lg mb-2">Budget vs Actual</h3>
                <p className="text-gray-400 font-nunito text-sm">
                    Set spending limits in the Plan tab to see your progress here.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm"
        >
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold font-quicksand text-gray-800 text-lg">Budget vs Actual</h3>
                <span className="text-xs text-gray-400 font-nunito">{budgetedItems.length} limits set</span>
            </div>

            <div className="divide-y divide-gray-50">
                {budgetedItems.map((item, i) => (
                    <BudgetRow key={item.category} item={item} delay={i * 0.06} />
                ))}
            </div>
        </motion.div>
    );
}
