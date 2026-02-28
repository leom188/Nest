import { useState } from "react";
import { Settings, LogOut, CreditCard, User, Users, ChevronLeft } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../stores/authStore";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { InvitePartnerPrompt } from "../components/InvitePartnerPrompt";

export function Menu() {
    const { signOut } = useAuthActions();
    const { user } = useAuthStore(); // Get user from store for subscription info
    const workspaces = useQuery(api.workspaces.getWorkspacesForUser);
    const updateWorkspace = useMutation(api.workspaces.updateWorkspaceSettings);

    // Simple state to manage view navigation
    const [currentView, setCurrentView] = useState<"menu" | "workspace_settings">("menu");

    // Assuming single workspace for now as per App.tsx logic
    const activeWorkspace = workspaces?.[0];

    const menuItems = [
        {
            icon: Users,
            label: "Workspace Settings",
            action: () => setCurrentView("workspace_settings"),
            description: "Manage members and preferences"
        },
        // ... other items (Account, Subscription, etc.) placeholders
        {
            icon: User,
            label: "Account",
            action: () => console.log("Account settings"),
            description: "Update your profile"
        },
        {
            icon: CreditCard,
            label: "Subscription",
            action: () => console.log("Subscription settings"),
            description: "Manage your plan"
        },
        {
            icon: Settings,
            label: "App Preferences",
            action: () => console.log("App settings"),
            description: "Theme and notifications"
        },
    ];

    if (currentView === "workspace_settings" && activeWorkspace) {
        return (
            <WorkspaceSettingsView
                workspace={activeWorkspace}
                user={user}
                onBack={() => setCurrentView("menu")}
                onUpdate={updateWorkspace}
            />
        );
    }

    return (
        <div className="flex flex-col h-full pb-20 safe-top pt-8">
            <h1 className="text-2xl font-bold font-quicksand text-gray-800 mb-6 px-4">Menu</h1>

            <div className="px-4 space-y-4">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.action}
                        className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="w-10 h-10 rounded-full bg-otter-blue/10 flex items-center justify-center text-otter-blue">
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold font-nunito text-gray-800">{item.label}</h3>
                            <p className="text-xs text-gray-500 font-nunito">{item.description}</p>
                        </div>
                    </button>
                ))}

                <div className="pt-4">
                    <button
                        onClick={() => signOut()}
                        className="w-full bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-4 hover:bg-red-100 transition-colors text-left text-red-600"
                    >
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold font-nunito">Sign Out</h3>
                            <p className="text-xs text-red-400 font-nunito">Log out of your account</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

function WorkspaceSettingsView({ workspace, user, onBack, onUpdate }: any) {
    const [name, setName] = useState(workspace.name);
    const [currency, setCurrency] = useState(workspace.currency);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate({
                workspaceId: workspace._id,
                name,
                currency
            });
            // Show success toast here if desired
        } catch (error) {
            console.error("Failed to update workspace", error);
        } finally {
            setIsSaving(false);
        }
    };

    const isPremium = user?.subscriptionTier === "premium";

    return (
        <div className="flex flex-col h-full pb-20 safe-top pt-4">
            <div className="px-4 mb-6 flex items-center gap-2">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold font-quicksand text-gray-800">Workspace Settings</h1>
            </div>

            <div className="px-4 space-y-8 overflow-y-auto">
                {/* General Settings */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold font-nunito text-gray-700">General</h3>

                    <div className="space-y-2">
                        <Label>Workspace Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 border-gray-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="h-12 border-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                <SelectItem value="JPY">JPY (¥)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full h-12 bg-otter-blue hover:bg-otter-blue/90 text-white rounded-xl"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                {/* Invite Partner Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold font-nunito text-gray-700">Members</h3>

                    {/* If user is FREE and wants to share (or is in personal workspace), show upgrade prompt */
                        /* Actually, user said: "inviting a member... is only available for shared workspaces for premium tier users." 
                           "Free users only have a personal workspace so they should be prompted to upgrade... to create a shared workspace"
                           This implies we need to check if they are in a personal workspace AND free.
                         */

                        (!isPremium && workspace.type === 'personal') ? (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-6 text-center space-y-4">
                                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">Invite a Partner</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Upgrade to Premium to create shared workspaces and track expenses together!
                                    </p>
                                </div>
                                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-md">
                                    Upgrade to Premium
                                </Button>
                            </div>
                        ) : (
                            /* Premium users OR users already in a shared workspace (legacy/invited) can see the invite prompt */
                            <InvitePartnerPrompt
                                workspaceId={workspace._id}
                                workspaceName={workspace.name}
                                workspaceType={workspace.type}
                            // No dismiss here, it's a settings page
                            />
                        )}
                </div>
            </div>
        </div>
    );
}
