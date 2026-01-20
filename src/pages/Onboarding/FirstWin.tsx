"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { Button } from "../../components/ui/button";
import { useAuthStore } from "../../stores/authStore";

export function FirstWin() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const completeOnboarding = useMutation(api.onboarding.completeOnboarding);

    const handleComplete = async (openExpenseModal = false) => {
        if (!user) return;

        setIsLoading(true);
        try {
            const plan = sessionStorage.getItem("onboarding_plan") as "free" | "premium" || "free";

            await completeOnboarding({
                plan,
            });

            // Update local auth store with onboarded state
            setUser({
                ...user,
                onboarded: true,
            });

            // Clear session storage
            sessionStorage.removeItem("onboarding_plan");

            // Navigate to home
            navigate("/", { state: { openExpenseModal } });
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
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
