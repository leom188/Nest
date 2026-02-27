"use client";

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { Loader2 } from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { PlanSelection } from "./pages/Onboarding/PlanSelection";
import { WorkspaceSetup } from "./pages/Onboarding/WorkspaceSetup";
import { FirstWin } from "./pages/Onboarding/FirstWin";
import { ContextualEmptyState } from "./components/ContextualEmptyState";

import { Insights } from "./pages/Insights";
import { Plan } from "./pages/Plan";
import { Menu } from "./pages/Menu";
import { Login } from "./pages/Login";
import { MainLayout } from "./components/MainLayout";
import { Invite } from "./pages/Invite";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-otter-white">
      <Loader2 className="h-12 w-12 animate-spin text-otter-blue" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function AppContent() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const workspaces = useQuery(api.workspaces.getWorkspacesForUser, isAuthenticated ? {} : "skip");

  if (authLoading || (isAuthenticated && workspaces === undefined)) {
    return <LoadingScreen />;
  }

  const needsOnboarding = isAuthenticated && user && !user.onboarded;
  const defaultWorkspaceId = workspaces?.[0]?._id;

  if (needsOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding/plan" element={<PlanSelection />} />
        <Route path="/onboarding/setup" element={<WorkspaceSetup />} />
        <Route path="/onboarding/first-win" element={<FirstWin />} />
        <Route path="*" element={<Navigate to="/onboarding/plan" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      <Route path="/invite" element={<Invite />} />

      <Route
        path="/onboarding/first-win"
        element={
          <AuthGuard>
            <FirstWin />
          </AuthGuard>
        }
      />

      <Route
        path="/onboarding/setup"
        element={
          <AuthGuard>
            <WorkspaceSetup />
          </AuthGuard>
        }
      />

      <Route
        element={
          <AuthGuard>
            {!defaultWorkspaceId ? (
              <div className="flex min-h-screen items-center justify-center bg-otter-white p-4">
                <ContextualEmptyState
                  workspaceType="personal"
                  onAddExpense={() => navigate('/onboarding/setup')}
                  customTitle="No workspace found"
                  customDescription="It looks like you don't have a workspace yet. Let's create one!"
                  customButtonText="Create Workspace"
                />
              </div>
            ) : (
              <MainLayout workspaceId={defaultWorkspaceId} />
            )}
          </AuthGuard>
        }
      >
        <Route path="/" element={defaultWorkspaceId ? <Dashboard workspaceId={defaultWorkspaceId} /> : null} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/plan" element={defaultWorkspaceId ? <Plan workspaceId={defaultWorkspaceId} /> : null} />
        <Route path="/menu" element={<Menu />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
