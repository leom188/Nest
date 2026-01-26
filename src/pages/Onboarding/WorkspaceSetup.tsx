"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Scale, Wallet } from "lucide-react";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { IllustratedCard } from "../../components/onboarding/IllustratedCard";

type Mode = "split" | "joint";

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function WorkspaceSetup() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const user = useQuery(api.users.current);
    const createSharedWorkspace = useMutation(api.onboarding.createSharedWorkspace);

    const handleCreateWorkspace = async (mode: Mode) => {
        if (user === undefined) {
            // Still loading user data
            return;
        }

        if (user === null) {
            console.error("User not found via useQuery");
            toast.error("Please login to create a workspace.");
            return;
        }

        setIsLoading(true);
        try {
            await createSharedWorkspace({
                name: mode === "split" ? "Household Split" : "Family Budget",
                type: mode,
                currency: "USD",
                splitMethod: mode === "split" ? "50/50" : undefined,
                monthlyTarget: undefined,
                ownerSplit: mode === "split" ? 50 : undefined,
            });

            // window.location.href = "/"; // Force reload to ensure workspace data is fresh
            navigate("/");
        } catch (error) {
            console.error("Failed to create workspace:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to create workspace: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <OnboardingLayout
            step={2}
            totalSteps={3}
            title="Let's set up your space"
            subtitle="As a Premium member, you can create flexible workspaces."
        >
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                <IllustratedCard
                    icon={Scale}
                    title="Fair Split"
                    description="Track shared expenses and settle up later."
                    onClick={() => handleCreateWorkspace("split")}
                    disabled={isLoading || user === undefined}
                />
                <IllustratedCard
                    icon={Wallet}
                    title="Common Pot"
                    description="Pool money together for a shared budget."
                    onClick={() => handleCreateWorkspace("joint")}
                    disabled={isLoading || user === undefined}
                />
            </div>
        </OnboardingLayout>
    );
}
