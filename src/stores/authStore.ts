import { create } from "zustand";

interface User {
  _id: string;
  tokenIdentifier: string;
  name: string;
  email: string;
  imageUrl?: string;
  image?: string;
  onboarded: boolean;
  income?: number;
  monthlyBudget?: number;
  currency?: string;
  theme?: "light" | "dark" | "system";
  subscriptionTier: "free" | "premium";
  subscriptionStatus: "active" | "inactive" | "cancelled";
  workspacesCreated: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    })
  ,
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
