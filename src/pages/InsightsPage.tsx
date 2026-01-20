"use client";

import { PageHeader } from "../components/PageHeader";
import { CategoryBreakdown } from "../components/ui/CategoryBreakdown";
import { BudgetProgress } from "../components/ui/BudgetProgress";
import { Id } from "../../convex/_generated/dataModel";

interface InsightsPageProps {
    workspaceId: Id<"workspaces">;
}

export function InsightsPage({ workspaceId }: InsightsPageProps) {
    return (
        <div className="min-h-screen bg-otter-white safe-all pb-24">
            <PageHeader title="Insights" />

            <div className="p-4 space-y-4">
                <CategoryBreakdown workspaceId={workspaceId} />
                <BudgetProgress workspaceId={workspaceId} />
            </div>
        </div>
    );
}
