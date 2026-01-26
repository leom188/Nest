import { Outlet } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AddExpenseModal } from "./AddExpenseModal";
import { useUIStore } from "../stores/uiStore";
import { Id } from "../../convex/_generated/dataModel";

interface MainLayoutProps {
    workspaceId: Id<"workspaces">;
}

export function MainLayout({ workspaceId }: MainLayoutProps) {
    const { isAddExpenseModalOpen, closeAddExpenseModal, editingExpense } = useUIStore();

    // Determine if we are editing (if editingExpense is set) or just adding
    // The modal handles this logic mostly via props, but passing editingExpense is key.

    return (
        <AppShell>
            <Outlet />
            <AddExpenseModal
                workspaceId={workspaceId}
                isOpen={isAddExpenseModalOpen}
                onClose={closeAddExpenseModal}
                onSuccess={closeAddExpenseModal}
                editingExpense={editingExpense}
            />
        </AppShell>
    );
}
