"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

import { ChevronDown, ChevronUp, Plus, Wallet, PiggyBank } from "lucide-react";
import { Button } from "./ui/button";

interface ContextBarProps {
    type: "personal" | "split" | "joint";
    workspaceName: string;
    onWorkspaceSelect?: (workspaceId: string) => void;
    onCreateWorkspace?: () => void;
    currentWorkspaceId?: string;
    membersCount?: number;
}

export function ContextBar({
    type,
    workspaceName,
    onWorkspaceSelect,
    onCreateWorkspace,
    currentWorkspaceId,
    membersCount
}: ContextBarProps) {
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);


    const workspaces = useQuery(api.workspaces.getWorkspacesForUser) || [];

    // config removed as it is no longer used for display labels

    const getWorkspaceIcon = (type: "personal" | "split" | "joint") => {
        if (type === "personal") return "👤";
        return type === "split" ? <Wallet className="h-4 w-4" /> : <PiggyBank className="h-4 w-4" />;
    };

    const getWorkspaceLabel = (type: "personal" | "split" | "joint") => {
        if (type === "personal") return "Personal";
        if (type === "split") return "Split";
        return "Shared";
    };

    const toggleWorkspaceMenu = () => {
        setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen);
    };

    return (
        <>
            {/* Backdrop for mobile menu */}
            <AnimatePresence>
                {isWorkspaceMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden"
                        onClick={() => setIsWorkspaceMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Workspace Menu */}
            <AnimatePresence>
                {isWorkspaceMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-top lg:hidden"
                    >
                        <div className="px-4 py-3">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold font-quicksand text-gray-800">Switch Workspace</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsWorkspaceMenuOpen(false)}
                                    className="h-8 w-8 rounded-full"
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {workspaces.map((workspace: any) => (
                                    <motion.div
                                        key={workspace._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${currentWorkspaceId === workspace._id
                                            ? "bg-otter-blue/10 border-otter-blue/30"
                                            : "bg-white border-gray-100 hover:bg-gray-50"
                                            }`}
                                        onClick={() => {
                                            onWorkspaceSelect?.(workspace._id);
                                            setIsWorkspaceMenuOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentWorkspaceId === workspace._id ? "bg-otter-blue text-white" : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {typeof getWorkspaceIcon(workspace.type) === 'string'
                                                        ? getWorkspaceIcon(workspace.type)
                                                        : getWorkspaceIcon(workspace.type)
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{workspace.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {getWorkspaceLabel(workspace.type)} • {workspace.membersCount} member{workspace.membersCount !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            {(workspace.userRole === "owner" || workspace.userRole === "admin") && (
                                                <div className="w-8" /> // Spacer to keep alignment if needed, or just remove the button code entirely.
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                <Button
                                    onClick={() => {
                                        onCreateWorkspace?.();
                                        setIsWorkspaceMenuOpen(false);
                                    }}
                                    className="w-full mt-3 bg-otter-blue hover:bg-otter-blue/90 text-white rounded-2xl h-12 font-bold"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    New Workspace
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Context Bar */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 safe-top transition-all duration-200">
                {/* Left side - Logo and current workspace */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                        <img src="/icons/logo.png" alt="Nest Logo" className="w-7 h-7 object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 group cursor-pointer" onClick={toggleWorkspaceMenu}>
                            <h1 className="text-lg font-bold font-quicksand text-gray-900 leading-tight truncate group-hover:text-otter-blue transition-colors">
                                {workspaceName}
                            </h1>
                            <div className="h-4 w-4 text-gray-400 group-hover:text-otter-blue/70 transition-colors">
                                {isWorkspaceMenuOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-gray-500 font-nunito uppercase tracking-wide">
                            <span>
                                {getWorkspaceLabel(type)} Workspace
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>
                                {membersCount || 1} Member{(membersCount || 1) !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right side - Removed as integrated into left side */}
            </div>
        </>
    );
}
