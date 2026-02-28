"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const COLORS = [
    "#4F46E5", // indigo
    "#7C3AED", // violet
    "#EC4899", // pink
    "#F59E0B", // amber
    "#10B981", // emerald
    "#3B82F6", // blue
    "#EF4444", // red
    "#8B5CF6", // purple
    "#14B8A6", // teal
    "#F97316", // orange
];

interface CategoryItem {
    category: string;
    name: string;
    emoji: string;
    amount: number;
}

interface CategoryBreakdownProps {
    data: CategoryItem[];
    totalSpent: number;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div className="bg-white shadow-lg rounded-2xl px-3 py-2 border border-gray-100 text-sm">
                <p className="font-bold text-gray-800">{item.emoji} {item.name}</p>
                <p className="text-gray-500">${item.amount.toFixed(2)}</p>
            </div>
        );
    }
    return null;
};

export function CategoryBreakdown({ data, totalSpent }: CategoryBreakdownProps) {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-gray-100">
                <h3 className="font-bold font-quicksand text-gray-800 text-lg mb-4">Category Breakdown</h3>
                <div className="text-center py-8 text-gray-400 font-nunito text-sm">
                    No expenses logged this month yet.
                </div>
            </div>
        );
    }

    const chartData = data.map((item) => ({
        ...item,
        percentage: totalSpent > 0 ? ((item.amount / totalSpent) * 100).toFixed(1) : "0",
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
        >
            <h3 className="font-bold font-quicksand text-gray-800 text-lg mb-4">Category Breakdown</h3>

            {/* Donut Chart */}
            <div className="h-44 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="amount"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Ranked list */}
            <div className="space-y-2">
                {chartData.map((item, index) => (
                    <div key={item.category} className="flex items-center gap-3">
                        <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-nunito text-gray-600 flex-1 truncate">
                            {item.emoji} {item.name}
                        </span>
                        <span className="text-sm font-bold font-quicksand text-gray-800 tabular-nums">
                            ${item.amount.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400 w-10 text-right tabular-nums">
                            {item.percentage}%
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
