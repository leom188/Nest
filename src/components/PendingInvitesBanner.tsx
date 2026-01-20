"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, UserPlus, Clock } from "lucide-react";

interface PendingInvitesBannerProps {
  onAccept?: () => void;
}

export function PendingInvitesBanner({ onAccept }: PendingInvitesBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    const stored = localStorage.getItem("dismissed_invites");
    return stored ? JSON.parse(stored) : {};
  });

  const invitations = useQuery(api.invitations.getPendingInvitations, {}) || [];

  if (!invitations || invitations.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    const now = Date.now();
    const newDismissed = { ...dismissed };
    invitations.forEach((inv: any) => {
      newDismissed[inv._id] = now + 24 * 60 * 60 * 1000;
    });
    setDismissed(newDismissed);
    localStorage.setItem("dismissed_invites", JSON.stringify(newDismissed));
  };

  const dismissibleInvitations = invitations.filter((inv: any) => {
    const dismissedTime = dismissed[inv._id];
    return !dismissedTime || dismissedTime < Date.now();
  });

  if (dismissibleInvitations.length === 0) {
    return null;
  }

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 p-4"
      >
        <Card className="bg-white border-none shadow-soft rounded-otter max-w-4xl mx-auto overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="bg-otter-blue/10 p-2.5 rounded-full">
                <UserPlus className="h-5 w-5 text-otter-blue" />
              </div>
              <div>
                <p className="font-bold text-gray-800 font-quicksand">
                  {dismissibleInvitations.length === 1
                    ? "You have a pending invitation"
                    : `You have ${dismissibleInvitations.length} pending invitations`}
                </p>
                <p className="text-sm text-gray-400">
                  {dismissibleInvitations.map((inv: any, i: number) => (
                    <span key={inv._id}>
                      {i > 0 && ", "}
                      {inv.workspaceName}
                      {i === dismissibleInvitations.length - 1 && (
                        <span className="ml-2 text-xs">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Expires in {formatTimeRemaining(inv.expiresAt)}
                        </span>
                      )}
                    </span>
                  ))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={onAccept}
                className="bg-otter-blue hover:bg-otter-blue/90 text-white rounded-xl font-bold px-4"
              >
                View Invitations
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="hover:bg-otter-fresh/20 h-8 w-8 text-otter-blue rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
