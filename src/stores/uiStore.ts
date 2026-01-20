import { create } from "zustand";

interface Toast {
    id: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    type?: "default" | "success" | "error";
}

interface UiState {
    toast: Toast | null;
    showToast: (params: Omit<Toast, "id">) => void;
    hideToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    toast: null,
    showToast: (params) => {
        const id = Math.random().toString(36).substring(7);
        set({ toast: { ...params, id } });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            set((state) => (state.toast?.id === id ? { toast: null } : state));
        }, 5000);
    },
    hideToast: () => set({ toast: null }),
}));
