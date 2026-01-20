"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Loader2, CheckCircle, UserPlus, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AcceptInvitationProps {
  initialCode?: string;
  onSuccess?: () => void;
}

export function AcceptInvitation({ initialCode, onSuccess }: AcceptInvitationProps) {
  const [code, setCode] = useState(initialCode || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const navigate = useNavigate();

  const acceptInvitationExistingUser = useMutation(api.invitations.acceptInvitationExistingUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !isAuthenticated) return;

    setIsLoading(true);
    setError("");

    try {
      await acceptInvitationExistingUser({
        code: code.trim().toUpperCase(),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError((err as Error).message || "Failed to accept invitation");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-otter-white">
        <Loader2 className="h-12 w-12 animate-spin text-otter-blue" />
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex min-h-screen items-center justify-center p-4"
      >
        <Card className="w-full max-w-md text-center bg-white border-none shadow-soft rounded-otter overflow-hidden p-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-otter-mint/20 p-4 rounded-full">
                <CheckCircle className="h-16 w-16 text-otter-mint" />
              </div>
              <h2 className="text-2xl font-bold font-quicksand text-otter-blue">Welcome to the Nest!</h2>
              <p className="text-gray-500 font-nunito font-medium">
                You've successfully joined the workspace.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-screen items-center justify-center p-4"
    >
      <Card className="w-full max-w-md bg-white border-none shadow-soft rounded-otter overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-quicksand text-otter-blue text-2xl">
            <UserPlus className="h-6 w-6" />
            Join a Workspace
          </CardTitle>
          <CardDescription className="text-gray-400 font-nunito">
            {isAuthenticated
              ? "Enter the invitation code to join a shared workspace."
              : "Please log in or create an account to join this workspace."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {error && (
              <div className="bg-otter-pink/10 border border-otter-pink/20 text-otter-pink text-sm p-4 rounded-xl font-bold">
                {error}
              </div>
            )}

            {isAuthenticated ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invitation Code</label>
                  <Input
                    placeholder="Enter 8-character code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="bg-otter-white border-otter-lavender/30 focus:border-otter-blue rounded-xl h-11 font-mono text-center text-lg"
                    maxLength={8}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!code.trim() || isLoading}
                  className="w-full bg-otter-blue hover:bg-otter-blue/90 text-white rounded-xl h-11 font-bold shadow-soft transition-all active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Workspace"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-otter-blue hover:bg-otter-blue/90 text-white rounded-xl h-11 font-bold shadow-soft transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Log In to Join
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/signup")}
                  className="w-full border-otter-blue text-otter-blue hover:bg-otter-blue/5 rounded-xl h-11 font-bold transition-all active:scale-95"
                >
                  Create New Account
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-500 text-center">
              <p>Invitation codes expire in 24 hours and can only be used once.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
