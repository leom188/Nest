"use client";

import { useNavigate } from "react-router-dom";
import { User, Sparkles } from "lucide-react";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { IllustratedCard } from "../../components/onboarding/IllustratedCard";

export function PlanSelection() {
    const navigate = useNavigate();

    const handlePlanSelection = (plan: "free" | "premium") => {
        // Store plan in session for later use
        sessionStorage.setItem("onboarding_plan", plan);

        if (plan === "free") {
            // Free plan - skip workspace setup, go directly to first win
            // The backend will handle creating the default Personal workspace
            navigate("/onboarding/first-win");
        } else {
            // Premium plan - show workspace setup
            navigate("/onboarding/setup"); // We'll create this route
        }
    };

    return (
        <OnboardingLayout
            step={1}
            totalSteps={3}
            title="Choose your plan"
            subtitle="Start simpler or unlock full power."
        >
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                {/* Free Plan */}
                <IllustratedCard
                    icon={User}
                    title="Nest Basic"
                    description="Forever free. Track personal expenses and manage 1 personal workspace."
                    selected={false}
                    onClick={() => handlePlanSelection("free")}
                    customButtonText="Continue with Free"
                />

                {/* Premium Plan */}
                <IllustratedCard
                    icon={Sparkles}
                    title="Nest Premium"
                    description="US$7.99/mo. Up to 2 workspaces (Joint & Personal). Share budgets with partners."
                    selected={false}
                    onClick={() => handlePlanSelection("premium")}
                    variant="premium"
                    customButtonText="Start 14-Day Free Trial"
                />
            </div>
        </OnboardingLayout>
    );
}
