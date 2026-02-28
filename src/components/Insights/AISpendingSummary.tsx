"use client";

import { useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Id } from "../../../convex/_generated/dataModel";

interface AISpendingSummaryProps {
    workspaceId: Id<"workspaces">;
}

export function AISpendingSummary({ workspaceId }: AISpendingSummaryProps) {
    const cached = useQuery(api.ai.getCachedSummary, { workspaceId });
    const [liveResult, setLiveResult] = useState<{ summary: string; generatedAt: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSummary = useAction(api.ai.generateSpendingSummary);

    // The displayed summary: prefer live result, then cached
    const result = liveResult || cached;

    // Auto-generate if no cached summary exists yet today
    useEffect(() => {
        if (cached === null && !isLoading && !liveResult && !error) {
            handleGenerate();
        }
    }, [cached]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await generateSummary({ workspaceId });
            setLiveResult(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate summary.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatRelative = (ts: number) => {
        const diffMs = Date.now() - ts;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 2) return "just now";
        if (diffHours < 1) return `${diffMins} minutes ago`;
        if (diffHours < 24) return "earlier today";
        if (diffDays === 1) return "yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return "this week";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl p-6 border border-violet-100"
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                    <h3 className="font-bold font-quicksand text-gray-800 text-base leading-tight">AI Spending Summary</h3>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center gap-3 py-4">
                    <div className="w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin flex-shrink-0" />
                    <p className="text-sm text-gray-500 font-nunito">Analyzing your spending patterns...</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="text-center py-2">
                    <p className="text-sm text-red-500 font-nunito mb-3">{error}</p>
                    <button
                        onClick={handleGenerate}
                        className="text-violet-600 text-sm font-bold font-nunito min-h-[44px] px-4"
                    >
                        Try again
                    </button>
                </div>
            )}

            {result && !isLoading && (
                <div>
                    <p className="text-gray-700 font-nunito text-sm leading-relaxed">{result.summary}</p>
                    {result.generatedAt && (
                        <p className="text-xs text-violet-400 font-nunito mt-3">
                            Updated {formatRelative(result.generatedAt)} · refreshes weekly
                        </p>
                    )}
                </div>
            )}

            {!result && !isLoading && !error && (
                <div className="text-center py-4">
                    <p className="text-gray-500 font-nunito text-sm mb-4 text-balance">
                        Get a personalized analysis of your spending habits this month.
                    </p>
                    <button
                        onClick={handleGenerate}
                        className="bg-violet-600 text-white text-sm font-bold font-nunito px-5 py-2.5 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity active:scale-95 flex items-center gap-2 mx-auto"
                    >
                        <Sparkles className="w-4 h-4" />
                        Analyze my spending
                    </button>
                </div>
            )}
        </motion.div>
    );
}
