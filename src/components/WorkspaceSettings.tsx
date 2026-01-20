"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { X, Copy, Check, Clock, UserCheck, UserX, RefreshCw } from "lucide-react";

interface WorkspaceSettingsProps {
  workspaceId: string;
  onClose?: () => void;
}

export function WorkspaceSettings({ workspaceId, onClose }: WorkspaceSettingsProps) {
  const [copied, setCopied] = useState(false);

  const invitations = useQuery(api.invitations.getWorkspaceInvitations, {
    workspaceId: workspaceId as Id<"workspaces">,
  }) || [];

  const createInvitation = useMutation(api.invitations.createInvitation);
  const cancelInvitation = useMutation(api.invitations.cancelInvitation);

  const handleCreateInvitation = async () => {
    try {
      await createInvitation({
        workspaceId: workspaceId as Id<"workspaces">,
        role: "member",
      });
    } catch (error) {
      console.error("Failed to create invitation:", error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation({
        invitationId: invitationId as Id<"invitations">,
      });
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeInvitation = invitations.find((inv: any) => inv.status === "pending");
  const expiredInvitations = invitations.filter((inv: any) => inv.status === "expired");
  const cancelledInvitations = invitations.filter((inv: any) => inv.status === "cancelled");
  const acceptedInvitations = invitations.filter((inv: any) => inv.status === "accepted");

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "accepted":
        return <UserCheck className="h-4 w-4 text-green-400" />;
      case "expired":
        return <Clock className="h-4 w-4 text-gray-400" />;
      case "cancelled":
        return <UserX className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-otter-blue/10 backdrop-blur-[2px]"
      >
        <div className="absolute inset-0" onClick={onClose} />

        <Card className="w-full max-w-2xl relative max-h-[80vh] overflow-hidden bg-white border-none shadow-soft rounded-otter">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-quicksand text-otter-blue">Workspace Settings</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-otter-fresh/20 h-8 w-8 text-otter-blue rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="overflow-y-auto">
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-bold font-quicksand text-gray-700 mb-3">Invitation Code</h3>
                <div className="bg-otter-white rounded-xl p-5 space-y-4 border border-otter-lavender/10">
                  {activeInvitation ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Active Invitation</p>
                          <p className="text-2xl font-mono font-bold tracking-wider">{activeInvitation.code}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyCode(activeInvitation.code)}
                          className="rounded-full border-otter-lavender/30 text-otter-blue hover:bg-otter-blue/10"
                        >
                          {copied ? <Check className="h-4 w-4 text-otter-mint" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Expires in {formatTimeRemaining(activeInvitation.expiresAt)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(activeInvitation._id)}
                          className="text-otter-pink hover:text-otter-pink hover:bg-otter-pink/10 rounded-lg"
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-400 mb-3">No active invitation</p>
                      <Button
                        onClick={handleCreateInvitation}
                        className="bg-otter-blue hover:bg-otter-blue/90 text-white rounded-xl font-bold px-6 shadow-soft"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Invitation Code
                      </Button>
                      <p className="text-xs text-gray-500 mt-3">
                        Share this code with others to invite them to join this workspace.
                        The code expires in 24 hours and can only be used once.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {acceptedInvitations.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold font-quicksand text-gray-700 mb-3">Accepted Invitations</h3>
                  <div className="space-y-3">
                    {acceptedInvitations.map((invitation: any) => (
                      <div key={invitation._id} className="bg-otter-white rounded-xl p-4 border border-otter-lavender/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invitation.status)}
                            <div>
                              <p className="text-sm font-medium">{invitation.acceptedBy?.email}</p>
                              <p className="text-xs text-gray-400">Accepted as {invitation.role}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(expiredInvitations.length > 0 || cancelledInvitations.length > 0) && (
                <section>
                  <h3 className="text-lg font-bold font-quicksand text-gray-700 mb-3">Past Invitations</h3>
                  <div className="space-y-3">
                    {[...expiredInvitations, ...cancelledInvitations].map((invitation: any) => (
                      <div key={invitation._id} className="bg-otter-white rounded-xl p-4 opacity-70 border border-otter-lavender/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invitation.status)}
                            <div>
                              <p className="text-sm font-mono">{invitation.code}</p>
                              <p className="text-xs text-gray-400 capitalize">{invitation.status}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
