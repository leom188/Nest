"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuthStore } from "../../stores/authStore";

interface SetBudgetModalProps {
    workspaceId: Id<"workspaces">;
    isOpen: boolean;
    onClose: () => void;
    currentBudget: number;
}

export function SetBudgetModal({
    workspaceId,
    isOpen,
    onClose,
    currentBudget,
}: SetBudgetModalProps) {
    const { user } = useAuthStore();
    const [budget, setBudget] = useState(currentBudget.toString());
    const [isLoading, setIsLoading] = useState(false);

    const setWorkspaceBudget = useMutation(api.workspaces.setWorkspaceBudget);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const budgetValue = parseFloat(budget);
        if (isNaN(budgetValue) || budgetValue < 0) return;
        if (!user) return;

        setIsLoading(true);
        try {
            await setWorkspaceBudget({
                workspaceId,
                budget: budgetValue,
            });
            onClose();
        } catch (error) {
            console.error("Failed to set budget:", error);
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
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 safe-bottom lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-otter lg:max-w-md lg:w-full"
                    >
                        <div className="flex justify-center pt-3 pb-2 lg:hidden">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <h2 className="text-xl font-bold font-quicksand text-gray-800">
                                Set Monthly Budget
                            </h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-6">
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={budget}
                                    onChange={(e) => {
                                        const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                                        const parts = cleaned.split(".");
                                        if (parts.length > 2) return;
                                        if (parts[1]?.length > 2) return;
                                        setBudget(cleaned);
                                    }}
                                    className="pl-12 text-3xl font-bold font-quicksand h-16 text-center"
                                    autoFocus
                                />
                            </div>

                            <p className="text-sm text-gray-400 text-center">
                                Set your monthly spending limit for this workspace
                            </p>

                            <div className="flex gap-3">
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
                                    disabled={isLoading || !budget || parseFloat(budget) < 0}
                                    className="flex-1"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Save
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
