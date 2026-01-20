"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell
} from "recharts";

interface CategoryBreakdownProps {
    workspaceId: Id<"workspaces">;
}

interface CategoryItem {
    category: string;
    name: string;
    emoji: string;
    amount: number;
}

const COLORS = ["#8b5cf6", "#6366f1", "#ec4899", "#f43f5e", "#f97316", "#10b981", "#06b6d4"];

export function CategoryBreakdown({ workspaceId }: CategoryBreakdownProps) {

    const workspace = useQuery(api.workspaces.getWorkspaceWithMembers, {
        workspaceId,
    });

    const isJointWorkspace = workspace?.type === "joint" || workspace?.type === "split";

    // We use getSpendingByCategory which aggregates ALL workspace members' expenses by category
    const categoryBreakdown = useQuery(api.expenses.getSpendingByCategory, {
        workspaceId,
    });

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryItem }> }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as CategoryItem;
            return (
                <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 font-nunito">
                    <p className="text-sm font-bold text-gray-800 mb-1">
                        {data.emoji} {data.name}
                    </p>
                    <p className="text-lg font-quicksand text-otter-blue font-bold">
                        ${data.amount.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-otter shadow-soft p-6"
        >
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-otter-lavender/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-otter-lavender" />
                </div>
                <div>
                    <h2 className="text-lg font-bold font-quicksand text-gray-800">
                        Spending by Category
                    </h2>
                    <p className="text-sm text-gray-400 font-nunito">
                        {isJointWorkspace ? "Combined spending from all members" : "Monthly breakdown by category"}
                    </p>
                </div>
            </div>

            {categoryBreakdown && categoryBreakdown.length > 0 ? (
                <div className="h-[350px] w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={categoryBreakdown}
                            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 10 }} />
                            <Bar
                                dataKey="amount"
                                radius={[10, 10, 0, 0]}
                                barSize={45}
                            >
                                {categoryBreakdown.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="py-12 text-center bg-gray-50 rounded-xl">
                    <p className="text-gray-400 font-nunito">
                        No spending data found for this month 🍃
                    </p>
                </div>
            )}
        </motion.div>
    );
}
