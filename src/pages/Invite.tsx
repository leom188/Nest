import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function Invite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
    const code = searchParams.get("code") || sessionStorage.getItem("pendingInviteCode");

    const acceptInvitation = useMutation(api.invitations.acceptInvitationExistingUser);

    const [status, setStatus] = useState<"idle" | "accepting" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            // Redirect to login preserving the invite code
            // We'll rely on the Login page to handle the redirect back if we pass it
            // or we can store it in sessionStorage
            sessionStorage.setItem("pendingInviteCode", code || "");
            navigate("/login?redirect=/invite");
            return;
        }

        if (!code) {
            setStatus("error");
            setErrorMessage("No invitation code provided.");
            return;
        }

        const handleAccept = async () => {
            setStatus("accepting");
            try {
                await acceptInvitation({ code });
                setStatus("success");
                // Clear any pending code
                sessionStorage.removeItem("pendingInviteCode");
            } catch (error: any) {
                console.error("Failed to accept invitation:", error);
                setStatus("error");
                setErrorMessage(error.message || "Failed to accept invitation. It may have expired or been used.");
            }
        };

        if (status === "idle") {
            handleAccept();
        }
    }, [authLoading, isAuthenticated, code, acceptInvitation, navigate, status]);

    if (authLoading || status === "idle") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-otter-white p-4">
                <Loader2 className="w-8 h-8 text-otter-blue animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-otter-white p-4">
            <Card className="max-w-md w-full p-8 shadow-soft rounded-otter border-none bg-white">
                <div className="text-center">
                    {status === "accepting" && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-otter-blue animate-spin" />
                            <h2 className="text-xl font-bold font-quicksand text-gray-800">Joining Workspace...</h2>
                        </div>
                    )}

                    {status === "success" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="w-16 h-16 bg-otter-mint/20 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-otter-mint" />
                            </div>
                            <h2 className="text-2xl font-bold font-quicksand text-gray-800">Welcome Aboard!</h2>
                            <p className="text-gray-500 font-nunito">You successfully joined the workspace.</p>
                            <Button
                                onClick={() => navigate("/")}
                                className="mt-4 bg-otter-blue hover:bg-otter-blue/90 text-white rounded-xl font-bold w-full"
                            >
                                Go to Dashboard
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="w-16 h-16 bg-otter-pink/20 rounded-full flex items-center justify-center">
                                <XCircle className="w-8 h-8 text-otter-pink" />
                            </div>
                            <h2 className="text-2xl font-bold font-quicksand text-gray-800">Invitation Failed</h2>
                            <p className="text-gray-500 font-nunito">{errorMessage}</p>
                            <Button
                                onClick={() => navigate("/")}
                                variant="outline"
                                className="mt-4 border-otter-blue/30 text-otter-blue hover:bg-otter-blue/5 rounded-xl font-bold w-full"
                            >
                                Go Home
                            </Button>
                        </motion.div>
                    )}
                </div>
            </Card>
        </div>
    );
}
