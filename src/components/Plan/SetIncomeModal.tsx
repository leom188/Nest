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

interface SetIncomeModalProps {
    userId: Id<"users">;
    isOpen: boolean;
    onClose: () => void;
    currentIncome: number;
}

export function SetIncomeModal({
    userId,
    isOpen,
    onClose,
    currentIncome,
}: SetIncomeModalProps) {
    const updateUser = useMutation(api.users.updateUser);
    const [income, setIncome] = useState(currentIncome.toString());
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const incomeValue = parseFloat(income);
        if (isNaN(incomeValue) || incomeValue < 0) return;

        setIsLoading(true);
        try {
            await updateUser({
                userId,
                income: incomeValue,
            });
            onClose();
        } catch (error) {
            console.error("Failed to update income:", error);
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
                        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2 bg-white rounded-3xl shadow-xl z-[101] overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold font-quicksand text-gray-800">
                                Monthly Income
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
                                <Label>Monthly Income</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={income}
                                        onChange={(e) => setIncome(e.target.value)}
                                        className="pl-8 font-quicksand font-bold text-lg"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-gray-400 font-nunito">
                                    Your targets will be compared against this monthly income.
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
                                    disabled={isLoading || !income}
                                    className="flex-1 bg-otter-blue hover:bg-otter-blue/90"
                                >
                                    {isLoading ? "Saving..." : "Save Income"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
