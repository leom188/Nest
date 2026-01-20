"use client";

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { AppShell } from "./components/AppShell";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";

import { BottomNav } from "./components/BottomNav";
import { CreateWorkspace } from "./components/CreateWorkspace";
import { WorkspaceSettings } from "./components/WorkspaceSettings";
import { AcceptInvitation } from "./components/AcceptInvitation";
import { PendingInvitesBanner } from "./components/PendingInvitesBanner";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { AddExpenseModal } from "./components/AddExpenseModal";
import { PlanSelection } from "./pages/Onboarding/PlanSelection";
import { WorkspaceSetup } from "./pages/Onboarding/WorkspaceSetup";
import { FirstWin } from "./pages/Onboarding/FirstWin";
import { useAuthStore } from "./stores/authStore";
import { InsightsPage } from "./pages/InsightsPage";
import { PlanPage } from "./pages/PlanPage";
import { MenuPage } from "./pages/MenuPage";
import { Loader2 } from "lucide-react";
import { Id } from "../convex/_generated/dataModel";

function RouterContent() {

  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>();
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [workspaceSettingsId, setWorkspaceSettingsId] = useState<string | undefined>();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteCode = searchParams.get("code");

  // Fetch user's workspaces
  const workspaces = useQuery(
    api.workspaces.getWorkspacesForUser,
    isAuthenticated && user ? {} : "skip"
  );

  // Auto-select default workspace when user logs in
  useEffect(() => {
    if (isAuthenticated && workspaces && workspaces.length > 0 && !currentWorkspaceId) {
      // Select the first workspace (should be Personal workspace)
      setCurrentWorkspaceId(workspaces[0]._id);
    }
  }, [isAuthenticated, workspaces, currentWorkspaceId]);

  // Check if user needs onboarding
  const needsOnboarding = isAuthenticated && user && !user.onboarded;

  const handleWorkspaceSettings = (workspaceId: string) => {
    setWorkspaceSettingsId(workspaceId);
    setShowWorkspaceSettings(true);
  };

  const handleShowInviteScreen = () => {
    navigate("/invite");
  };

  const handleAddExpense = () => {
    setShowAddExpense(true);
  };

  // Redirect to onboarding if needed
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
    <div className="min-h-screen bg-otter-white flex">
      {/* Pending Invites Banner */}
      {isAuthenticated && <PendingInvitesBanner onAccept={handleShowInviteScreen} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        <AppShell>
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" /> : <Login />}
            />
            <Route
              path="/signup"
              element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
            />
            <Route
              path="/invite"
              element={
                isAuthenticated ? (
                  <AcceptInvitation
                    initialCode={inviteCode || undefined}
                    onSuccess={() => {
                      navigate("/");
                      setCurrentWorkspaceId(undefined);
                    }}
                  />
                ) : (
                  <AcceptInvitation
                    initialCode={inviteCode || undefined}
                    onSuccess={() => navigate("/login")}
                  />
                )
              }
            />
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  currentWorkspaceId ? (
                    <Dashboard
                      workspaceId={currentWorkspaceId as Id<"workspaces">}
                      onWorkspaceSelect={setCurrentWorkspaceId}
                      onCreateWorkspace={() => setShowCreateWorkspace(true)}
                      onWorkspaceSettings={handleWorkspaceSettings}
                    />
                  ) : (
                    <WorkspaceSelector
                      onWorkspaceSelect={setCurrentWorkspaceId}
                      onCreateWorkspace={() => setShowCreateWorkspace(true)}
                    />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/insights"
              element={
                isAuthenticated && currentWorkspaceId ? (
                  <InsightsPage workspaceId={currentWorkspaceId as Id<"workspaces">} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/plan"
              element={
                isAuthenticated && currentWorkspaceId ? (
                  <PlanPage workspaceId={currentWorkspaceId as Id<"workspaces">} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/menu"
              element={isAuthenticated ? <MenuPage /> : <Navigate to="/login" />}
            />
          </Routes>
        </AppShell>

        {/* Bottom Navigation - Visible everywhere now */}
        {isAuthenticated && (
          <BottomNav
            onAddExpense={handleAddExpense}
            isAddDisabled={!currentWorkspaceId}
          />
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateWorkspace && (
        <CreateWorkspace
          onSuccess={() => {
            setShowCreateWorkspace(false);
          }}
          onCancel={() => setShowCreateWorkspace(false)}
        />
      )}

      {/* Workspace Settings Modal */}
      {showWorkspaceSettings && workspaceSettingsId && (
        <WorkspaceSettings
          workspaceId={workspaceSettingsId}
          onClose={() => setShowWorkspaceSettings(false)}
        />
      )}

      {/* Add Expense Modal */}
      {showAddExpense && currentWorkspaceId && (
        <AddExpenseModal
          workspaceId={currentWorkspaceId as Id<"workspaces">}
          isOpen={showAddExpense}
          onClose={() => setShowAddExpense(false)}
        />
      )}
    </div>
  );
}

// Workspace selector for when no workspace is selected
function WorkspaceSelector({
  onWorkspaceSelect,
  onCreateWorkspace,
}: {
  onWorkspaceSelect: (id: string) => void;
  onCreateWorkspace: () => void;
}) {
  const navigate = useNavigate();
  const workspaces = useQuery(api.workspaces.getWorkspacesForUser, {});

  if (!workspaces) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-otter-blue/30 border-t-otter-blue rounded-full animate-spin" />
      </div>
    );
  }

  // Auto-select the first workspace if there's only one (e.g., Personal)
  if (workspaces.length === 1) {
    onWorkspaceSelect(workspaces[0]._id);
    return null;
  }

  return (
    <div className="p-4 safe-x">
      <h1 className="text-2xl font-bold font-quicksand text-otter-blue mb-6">
        Choose a Workspace
      </h1>

      <div className="space-y-3">
        {workspaces.map((workspace: any) => (
          <button
            key={workspace._id}
            onClick={() => onWorkspaceSelect(workspace._id)}
            className="w-full bg-white rounded-otter shadow-soft p-4 flex items-center gap-4 text-left hover:shadow-md transition-shadow"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${workspace.type === "personal"
                ? "bg-otter-fresh/20"
                : workspace.type === "split"
                  ? "bg-otter-mint/20"
                  : "bg-otter-lavender/20"
                }`}
            >
              <span className="text-2xl">
                {workspace.type === "personal"
                  ? "👤"
                  : workspace.type === "split"
                    ? "⚖️"
                    : "🏦"}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-bold font-quicksand text-gray-800">
                {workspace.name}
              </p>
              <p className="text-sm text-gray-400 font-nunito">
                {workspace.type === "personal"
                  ? "Personal"
                  : workspace.type === "split"
                    ? "Split Tracking"
                    : "Common Pot"}
                {" · "}
                {workspace.membersCount} member{workspace.membersCount !== 1 ? "s" : ""}
              </p>
            </div>
          </button>
        ))}

        <button
          onClick={onCreateWorkspace}
          className="w-full border-2 border-dashed border-otter-blue/30 rounded-otter p-4 text-otter-blue font-bold hover:border-otter-blue/50 hover:bg-otter-blue/5 transition-colors"
        >
          + Create New Workspace
        </button>

        <button
          onClick={() => navigate("/invite")}
          className="w-full bg-otter-blue/10 rounded-otter p-4 text-otter-blue font-bold hover:bg-otter-blue/20 transition-colors"
        >
          Accept Invitation
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.users.current);
  const { setUser, setLoading, isLoading } = useAuthStore();

  // Sync auth state to store
  useEffect(() => {
    setLoading(authLoading);
    if (!authLoading) {
      if (isAuthenticated && user) {
        // Map Convex user to store user type if needed
        setUser({
          ...user,
          tokenIdentifier: user._id, // Using _id as identifier now
          imageUrl: user.image
        } as any);
      } else if (!isAuthenticated) {
        setUser(null);
      }
    }
  }, [authLoading, isAuthenticated, user, setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-otter-white">
        <Loader2 className="h-12 w-12 animate-spin text-otter-blue" />
      </div>
    );
  }

  return (
    <Router>
      <RouterContent />
    </Router>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
