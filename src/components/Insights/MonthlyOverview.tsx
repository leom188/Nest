"use client";

import { motion } from "framer-motion";

interface MonthlyOverviewProps {
    totalSpent: number;
    budget: number;
    transactionCount: number;
}

export function MonthlyOverview({ totalSpent, budget, transactionCount }: MonthlyOverviewProps) {
    const remaining = budget - totalSpent;
    const isOver = remaining < 0;
    const monthName = new Date().toLocaleString("default", { month: "long" });

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-3xl p-6 text-white relative overflow-hidden"
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-xl" />

            <div className="relative z-10">
                <p className="text-white/60 font-nunito text-xs font-semibold uppercase tracking-widest mb-1">
                    {monthName} · {transactionCount} transaction{transactionCount !== 1 ? "s" : ""}
                </p>
                <h2 className="text-4xl font-bold font-quicksand tabular-nums tracking-tight mb-3">
                    ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>

                {budget > 0 ? (
                    <div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className={`h-full rounded-full ${isOver ? "bg-red-400" : "bg-white"}`}
                            />
                        </div>
                        <p className={`text-sm font-bold font-nunito ${isOver ? "text-red-300" : "text-green-300"}`}>
                            {isOver
                                ? `$${Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} over budget`
                                : `$${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining`
                            }
                        </p>
                    </div>
                ) : (
                    <p className="text-white/50 text-sm font-nunito">No budget set</p>
                )}
            </div>
        </motion.div>
    );
}
