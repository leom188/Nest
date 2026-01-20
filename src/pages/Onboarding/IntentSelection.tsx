"use client";

import { useNavigate } from "react-router-dom";
import { User, Users } from "lucide-react";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { IllustratedCard, PremiumIllustratedCard } from "../../components/onboarding/IllustratedCard";
import { useAuthStore } from "../../stores/authStore";

type Intent = "solo" | "partner";

export function IntentSelection() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const isPremium = user?.subscriptionTier === "premium";

    const handleIntentSelection = (intent: Intent) => {
        // Store intent in session for later use
        sessionStorage.setItem("onboarding_intent", intent);

        if (intent === "solo") {
            // Personal plan - skip mode selection, go directly to first win
            navigate("/onboarding/first-win");
        } else {
            // Premium plan - show mode selector for workspace type selection
            navigate("/onboarding/mode");
        }
    };

    const handleUpgrade = () => {
        // For now, just show an alert. In the future, this could navigate to a pricing page
        alert("Premium upgrade coming soon! Contact support for early access.");
    };

    return (
        <OnboardingLayout
            step={1}
            totalSteps={3}
            title="How will you use Nest?"
            subtitle={
                isPremium
                    ? "Choose how you'll get started with Nest"
                    : "Choose your plan. Upgrade anytime to unlock premium features."
            }
        >
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                <IllustratedCard
                    icon={User}
                    title="Personal"
                    description="Track personal expenses, create budgets, and monitor spending patterns, and manage up to 2 workspaces. Perfect for individual financial management."
                    selected={false}
                    onClick={() => handleIntentSelection("solo")}
                />

                {isPremium ? (
                    <IllustratedCard
                        icon={Users}
                        title="Premium"
                        description="Everything in Personal, plus unlimited workspaces, joint expense sharing, AI-powered insights, voice expense entry, and advanced analytics."
                        selected={false}
                        onClick={() => handleIntentSelection("partner")}
                    />
                ) : (
                    <PremiumIllustratedCard
                        icon={Users}
                        title="Premium"
                        description="Everything in Personal, plus unlimited workspaces, joint expense sharing, AI-powered insights, voice expense entry, and advanced analytics."
                        onUpgrade={handleUpgrade}
                    />
                )}
            </div>
        </OnboardingLayout>
    );
}
