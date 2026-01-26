"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface SetTotalBudgetModalProps {
    workspaceId: Id<"workspaces">;
    isOpen: boolean;
    onClose: () => void;
    currentBudget: number;
}

export function SetTotalBudgetModal({
    workspaceId,
    isOpen,
    onClose,
    currentBudget,
}: SetTotalBudgetModalProps) {
    const setWorkspaceBudget = useMutation(api.workspaces.setWorkspaceBudget);
    const [budget, setBudget] = useState(currentBudget > 0 ? currentBudget.toString() : "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const budgetValue = parseFloat(budget);
        if (isNaN(budgetValue) || budgetValue < 0) return;

        setIsLoading(true);
        try {
            await setWorkspaceBudget({
                workspaceId,
                budget: budgetValue,
            });
            onClose();
        } catch (error) {
            console.error("Failed to set total budget:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-otter shadow-xl z-50 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold font-quicksand text-gray-800">
                                Set Total Monthly Budget
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label>Total Monthly Limit</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="pl-8 font-quicksand font-bold text-lg"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-sm text-gray-400">
                                    This is your overall spending limit for the entire workspace.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading || !budget}
                                    className="flex-1 bg-otter-blue hover:bg-otter-blue/90"
                                >
                                    {isLoading ? "Saving..." : "Save Budget"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
