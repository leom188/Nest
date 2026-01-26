"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { BudgetTab } from "../components/Plan/BudgetTab";
import { RecurringTab } from "../components/Plan/RecurringTab";

export function Plan() {
    const [activeTab, setActiveTab] = useState<"budget" | "recurring">("budget");

    // Get active workspace
    const workspaces = useQuery(api.workspaces.getWorkspacesForUser);
    // For now, default to the first workspace or specific one if stored in localStorage/URL
    // Similar logic to Dashboard - ideally getting current workspace from context
    // We'll grab the first one for MVP or last active
    const activeWorkspaceId = workspaces?.[0]?._id;

    if (!workspaces) {
        return <div className="p-8 text-center">Loading plan...</div>;
    }

    if (!activeWorkspaceId) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold font-quicksand">No Workspace Found</h2>
                <p className="text-gray-500">Please create a workspace to start planning.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-otter-white">
            <div className="p-4 pt-6 bg-white border-b border-gray-100 sticky top-0 z-10">
                <h1 className="text-2xl font-bold font-quicksand text-gray-800 mb-6">Plan</h1>

                {/* Tab Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab("budget")}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "budget"
                            ? "bg-white text-otter-blue shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        Budget
                    </button>
                    <button
                        onClick={() => setActiveTab("recurring")}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "recurring"
                            ? "bg-white text-otter-blue shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        Recurring
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
                {activeTab === "budget" ? (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="h-full"
                    >
                        <BudgetTab workspaceId={activeWorkspaceId} />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="h-full"
                    >
                        <RecurringTab workspaceId={activeWorkspaceId} />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
