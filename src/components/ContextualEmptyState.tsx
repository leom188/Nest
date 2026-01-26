"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { Button } from "./ui/button";

interface ContextualEmptyStateProps {
    workspaceType: "personal" | "split" | "joint";
    onAddExpense: () => void;
    customTitle?: string;
    customDescription?: string;
    customButtonText?: string;
}

export function ContextualEmptyState({
    workspaceType,
    onAddExpense,
    customTitle,
    customDescription,
    customButtonText
}: ContextualEmptyStateProps) {
    const isShared = workspaceType === "split" || workspaceType === "joint";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white rounded-otter shadow-soft p-8 text-center"
        >
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 bg-otter-blue/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <Wallet className="w-8 h-8 text-otter-blue" />
            </motion.div>

            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold font-quicksand text-gray-800 mb-2"
            >
                {customTitle || (isShared ? "Add your first shared expense" : "Start tracking your expenses")}
            </motion.h3>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 font-nunito mb-6"
            >
                {customDescription || (isShared
                    ? "Track shared expenses together and see who owes what."
                    : "Log your first expense to start your budget journey.")}
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Button
                    onClick={onAddExpense}
                    className="w-full max-w-xs mx-auto"
                >
                    {customButtonText || (isShared ? "Add Shared Expense" : "Add First Expense")}
                </Button>
            </motion.div>
        </motion.div>
    );
}
