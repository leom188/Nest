"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Scale, Wallet, User } from "lucide-react";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { IllustratedCard } from "../../components/onboarding/IllustratedCard";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuthStore } from "../../stores/authStore";

type Mode = "personal" | "split" | "joint";

export function WorkspaceSetup() {
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
        } else if (mode === "personal" && !workspaceName) {
            setWorkspaceName("Personal");
        }
    };

    const handleContinue = async () => {
        if (!selectedMode || !workspaceName) return;

        if (!user) {
            console.error("User not found in store");
            alert("Please wait for login to complete.");
            return;
        }

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
        } catch (error: any) {
            console.error("Failed to create workspace:", error);
            alert(`Failed to create workspace: ${error.message || "Unknown error"}`);
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
            title="Let's set up your space"
            subtitle="As a Premium member, you can create flexible workspaces."
        >
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <IllustratedCard
                    icon={User}
                    title="Personal"
                    description="Just for you. Private and secure."
                    selected={selectedMode === "personal"}
                    onClick={() => handleModeSelection("personal")}
                />
                <IllustratedCard
                    icon={Scale}
                    title="Fair Split"
                    description="Track shared expenses and settle up later."
                    selected={selectedMode === "split"}
                    onClick={() => handleModeSelection("split")}
                />
                <IllustratedCard
                    icon={Wallet}
                    title="Common Pot"
                    description="Pool money together for a shared budget."
                    selected={selectedMode === "joint"}
                    onClick={() => handleModeSelection("joint")}
                />
            </div>

            {selectedMode && (
                <div className="bg-white rounded-otter shadow-soft p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Name your workspace
                        </label>
                        <Input
                            placeholder="e.g., My Apartment"
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
