"use client";

import { useState } from "react";
import { Sparkles, Crown, User, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { IllustratedCard } from "../../components/onboarding/IllustratedCard";
import { Button } from "../../components/ui/button";

type Plan = "free" | "premium";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function PlanSelection() {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [showPremiumOptions, setShowPremiumOptions] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const setSubscription = useMutation(api.onboarding.setSubscriptionTier);
    const completeOnboarding = useMutation(api.onboarding.completeOnboarding);

    const handleFreePlan = async () => {
        console.log("handleFreePlan called");
        setSelectedPlan("free");
        sessionStorage.setItem("onboarding_plan", "free");

        setIsProcessing(true);
        try {
            console.log("Calling completeOnboarding...");
            await completeOnboarding({ plan: "free" });
            console.log("completeOnboarding completed, navigating to /onboarding/first-win");
            setTimeout(() => {
                navigate("/onboarding/first-win");
            }, 200);
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to complete onboarding: ${errorMessage}`);
            setIsProcessing(false);
        }
    };

    const handlePremiumClick = () => {
        setShowPremiumOptions(true);
    };

    const handlePremiumPersonal = async () => {
        console.log("handlePremiumPersonal called");
        setSelectedPlan("premium");
        sessionStorage.setItem("onboarding_plan", "premium");

        setIsProcessing(true);
        try {
            console.log("Calling setSubscription...");
            await setSubscription({ tier: "premium" });
            console.log("Calling completeOnboarding...");
            await completeOnboarding({ plan: "premium" });
            console.log("completeOnboarding completed");

            // Close modal first
            setShowPremiumOptions(false);

            // Force navigation with page reload
            setTimeout(() => {
                console.log("Navigating to /onboarding/first-win");
                navigate("/onboarding/first-win");
            }, 200);
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to complete onboarding: ${errorMessage}`);
            setIsProcessing(false);
        }
    };

    const handlePremiumShared = async () => {
        console.log("handlePremiumShared called");
        setSelectedPlan("premium");
        sessionStorage.setItem("onboarding_plan", "premium");

        setIsProcessing(true);
        try {
            console.log("Calling setSubscription...");
            await setSubscription({ tier: "premium" });
            console.log("setSubscription completed");

            // Close modal first
            setShowPremiumOptions(false);

            // Use window.location to force navigation after state updates
            setTimeout(() => {
                console.log("Navigating to /onboarding/setup");
                navigate("/onboarding/setup");
            }, 200);
        } catch (error) {
            console.error("Failed to set subscription:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to proceed: ${errorMessage}`);
            setIsProcessing(false);
        }
    };

    return (
        <OnboardingLayout
            step={1}
            totalSteps={3}
            title="Choose your path"
            subtitle="Start small or go big. You can always change later."
        >
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                {/* Free Tier */}
                <IllustratedCard
                    icon={Sparkles}
                    title="Nest Free"
                    description="Perfect for solo flyers."
                    variant="default"
                    customButtonText={isProcessing && selectedPlan === "free" ? "Processing..." : "Start Free"}
                    onClick={handleFreePlan}
                    disabled={isProcessing}
                    className={selectedPlan === "free" ? "ring-4 ring-otter-blue" : ""}
                >
                    <ul className="space-y-3 mt-4 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-otter-blue" />
                            1 Personal Workspace
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-otter-blue" />
                            Basic expense tracking
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-otter-blue" />
                            Monthly summary
                        </li>
                    </ul>
                </IllustratedCard>

                {/* Premium Tier */}
                <IllustratedCard
                    icon={Crown}
                    title="Nest Premium"
                    description="For couples & power users."
                    variant="premium"
                    customButtonText={isProcessing && showPremiumOptions ? "Processing..." : "Start Premium Trial"}
                    onClick={handlePremiumClick}
                    disabled={isProcessing}
                    className={selectedPlan === "premium" ? "ring-4 ring-orange-400" : ""}
                >
                    <ul className="space-y-3 mt-4 text-sm text-orange-900/80">
                        <li className="flex items-center gap-2">
                            <Crown className="w-3 h-3 text-orange-500" />
                            Unlimited Workspaces
                        </li>
                        <li className="flex items-center gap-2">
                            <Crown className="w-3 h-3 text-orange-500" />
                            Fair Split & Common Pot modes
                        </li>
                        <li className="flex items-center gap-2">
                            <Crown className="w-3 h-3 text-orange-500" />
                            Advanced insights & AI
                        </li>
                    </ul>
                </IllustratedCard>
            </div>

            {showPremiumOptions && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowPremiumOptions(false)}
                >
                    <div
                        className="bg-white rounded-otter shadow-soft p-8 max-w-2xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold font-quicksand text-gray-800 mb-4 text-center">
                            What would you like to start with?
                        </h3>
                        <p className="text-gray-500 font-nunito mb-8 text-center">
                            As a Premium member, you can have multiple workspaces.
                            Choose what to create now.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Button
                                onClick={handlePremiumPersonal}
                                disabled={isProcessing}
                                className="flex flex-col items-center gap-3 p-6 h-auto hover:bg-otter-blue/90"
                            >
                                <User className="w-8 h-8" />
                                <div className="text-center">
                                    <div className="font-bold text-lg">Personal</div>
                                    <div className="text-sm opacity-80">
                                        Just for you. Private and secure.
                                    </div>
                                </div>
                                {isProcessing && <span className="text-xs">Processing...</span>}
                            </Button>

                            <Button
                                onClick={handlePremiumShared}
                                disabled={isProcessing}
                                variant="outline"
                                className="flex flex-col items-center gap-3 p-6 h-auto border-otter-blue text-otter-blue hover:bg-otter-blue/10"
                            >
                                <Scale className="w-8 h-8" />
                                <div className="text-center">
                                    <div className="font-bold text-lg">Shared</div>
                                    <div className="text-sm opacity-80">
                                        Fair Split or Common Pot
                                    </div>
                                </div>
                                {isProcessing && <span className="text-xs">Processing...</span>}
                            </Button>
                        </div>

                        <button
                            onClick={() => setShowPremiumOptions(false)}
                            className="mt-6 w-full text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}
        </OnboardingLayout>
    );
}
