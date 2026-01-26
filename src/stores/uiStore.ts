import { create } from "zustand";

// Define the Expense interface here since it's used in the store
export interface Expense {
    _id: string;
    amount: number;
    description: string;
    category: string;
    date: number;
    isRecurring?: boolean;
    payer: { name?: string; email?: string } | null;
    workspaceId?: string;
}

interface UIState {
    isAddExpenseModalOpen: boolean;
    editingExpense: Expense | null;
    openAddExpenseModal: (expense?: Expense) => void;
    closeAddExpenseModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isAddExpenseModalOpen: false,
    editingExpense: null,
    openAddExpenseModal: (expense) => set({
        isAddExpenseModalOpen: true,
        editingExpense: expense || null
    }),
    closeAddExpenseModal: () => set({
        isAddExpenseModalOpen: false,
        editingExpense: null
    }),
}));
