"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { Button } from "../../components/ui/button";

export function FirstWin() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const user = useQuery(api.users.current);

    const handleComplete = async (openExpenseModal = false) => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Navigate to home
            navigate("/", { state: { openExpenseModal } });
        } catch (error) {
            console.error("Failed to navigate:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <OnboardingLayout
            step={3}
            totalSteps={3}
            title="You're all set! 🎉"
            subtitle="Your Nest is ready. Let's log your first expense!"
        >
            <div className="flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="bg-white rounded-otter shadow-soft p-8 text-center max-w-md"
                >
                    <div className="w-20 h-20 bg-otter-mint/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-otter-mint" />
                    </div>

                    <h2 className="text-2xl font-bold font-quicksand text-gray-800 mb-4">
                        Welcome to your Nest!
                    </h2>

                    <p className="text-gray-500 font-nunito mb-6">
                        Track expenses, split bills, and manage your money with ease.
                        Start by adding your first expense to see the magic happen.
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={() => handleComplete(true)}
                            className="w-full"
                            disabled={isLoading}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add First Expense
                        </Button>

                        <Button
                            onClick={() => handleComplete(false)}
                            variant="ghost"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Finishing..." : "Skip for now"}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </OnboardingLayout>
    );
}
