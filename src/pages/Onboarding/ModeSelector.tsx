"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Scale, Wallet } from "lucide-react";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { IllustratedCard } from "../../components/onboarding/IllustratedCard";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuthStore } from "../../stores/authStore";

type Mode = "split" | "joint";

export function ModeSelector() {
    const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
    const [workspaceName, setWorkspaceName] = useState("");
    const [monthlyTarget, setMonthlyTarget] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const createSharedWorkspace = useMutation(api.onboarding.createSharedWorkspace);

    const handleModeSelection = (mode: Mode) => {
        setSelectedMode(mode);
        // Auto-populate workspace name based on selection
        if (mode === "split" && !workspaceName) {
            setWorkspaceName("Household Split");
        } else if (mode === "joint" && !workspaceName) {
            setWorkspaceName("Family Budget");
        }
    };

    const handleContinue = async () => {
        if (!selectedMode || !workspaceName || !user) return;

        setIsLoading(true);
        try {
            await createSharedWorkspace({
                name: workspaceName,
                type: selectedMode,
                currency: "USD",
                splitMethod: selectedMode === "split" ? "50/50" : undefined,
                monthlyTarget: selectedMode === "joint" ? parseFloat(monthlyTarget) || undefined : undefined,
            });

            navigate("/onboarding/first-win");
        } catch (error) {
            console.error("Failed to create workspace:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-enable continue when form is valid
    const isFormValid = selectedMode && workspaceName.trim().length > 0;

    return (
        <OnboardingLayout
            step={2}
            totalSteps={3}
            title="How do you want to share?"
            subtitle="Choose your preferred way to manage shared expenses"
        >
            <div className="grid gap-4 md:grid-cols-2 mb-6">
                <IllustratedCard
                    icon={Scale}
                    title="The Fair Splitter"
                    description="Track who paid what and settle up at the end of the month. Perfect for keeping individual finances separate."
                    selected={selectedMode === "split"}
                    onClick={() => handleModeSelection("split")}
                />
                <IllustratedCard
                    icon={Wallet}
                    title="The Common Pot"
                    description="Pool money into a shared budget. Great for couples with unified finances."
                    selected={selectedMode === "joint"}
                    onClick={() => handleModeSelection("joint")}
                />
            </div>

            {selectedMode && (
                <div className="bg-white rounded-otter shadow-soft p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Name your shared space
                        </label>
                        <Input
                            placeholder={selectedMode === "split" ? "e.g., Household Split" : "e.g., Family Budget"}
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && isFormValid && !isLoading) {
                                    handleContinue();
                                }
                            }}
                        />
                    </div>

                    {selectedMode === "joint" && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Monthly budget target (optional)
                            </label>
                            <Input
                                type="number"
                                placeholder="e.g., 2000"
                                value={monthlyTarget}
                                onChange={(e) => setMonthlyTarget(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 flex justify-center">
                <Button
                    onClick={handleContinue}
                    disabled={!isFormValid || isLoading}
                    className={`px-12 transition-all ${isFormValid && !isLoading
                            ? "bg-otter-blue hover:bg-otter-blue/90 shadow-lg scale-105"
                            : ""
                        }`}
                >
                    {isLoading ? "Creating..." : "Create Workspace"}
                </Button>
            </div>
        </OnboardingLayout>
    );
}
