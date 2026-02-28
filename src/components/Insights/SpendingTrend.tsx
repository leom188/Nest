"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface TrendPoint {
    month: string;
    amount: number;
}

interface SpendingTrendProps {
    data: TrendPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white shadow-lg rounded-2xl px-3 py-2 border border-gray-100 text-sm">
                <p className="font-bold text-gray-800">{label}</p>
                <p className="text-[#4F46E5] font-bold">${payload[0].value.toFixed(2)}</p>
            </div>
        );
    }
    return null;
};

export function SpendingTrend({ data }: SpendingTrendProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
        >
            <h3 className="font-bold font-quicksand text-gray-800 text-lg mb-1">Spending Trend</h3>
            <p className="text-xs text-gray-400 font-nunito mb-5">Last 6 months</p>

            <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "Nunito" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "Nunito" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#4F46E5"
                            strokeWidth={2}
                            fill="url(#trendGradient)"
                            dot={{ fill: "#4F46E5", strokeWidth: 0, r: 3 }}
                            activeDot={{ r: 5, fill: "#4F46E5", strokeWidth: 0 }}
                            animationDuration={800}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
