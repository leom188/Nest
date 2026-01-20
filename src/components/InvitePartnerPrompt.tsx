"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { UserPlus, Copy, Check, QrCode } from "lucide-react";
import { Button } from "./ui/button";
import { Id } from "../../convex/_generated/dataModel";

interface InvitePartnerPromptProps {
    workspaceId: Id<"workspaces">;
    workspaceName: string;
    workspaceType: "split" | "joint";
}

export function InvitePartnerPrompt({
    workspaceId,
    workspaceName,
    workspaceType,
}: InvitePartnerPromptProps) {
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const createInvitation = useMutation(api.invitations.createInvitation);

    const handleGenerateCode = async () => {
        setIsLoading(true);
        try {
            const result = await createInvitation({
                workspaceId,
                role: "member",
            });
            setInviteCode(result.code);
        } catch (error) {
            console.error("Failed to generate invite code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteCode) return;

        const inviteUrl = `${window.location.origin}/invite?code=${inviteCode}`;
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const typeLabel = workspaceType === "joint" ? "Common Pot" : "Split";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-otter-blue/5 to-otter-lavender/10 rounded-otter p-6 border-2 border-dashed border-otter-blue/30"
        >
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-otter-blue/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-7 h-7 text-otter-blue" />
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold font-quicksand text-gray-800 mb-1">
                        Your {typeLabel} is waiting for a partner!
                    </h3>
                    <p className="text-gray-500 font-nunito text-sm mb-4">
                        Invite your partner or roommate to join "{workspaceName}" and start tracking together.
                    </p>

                    {!inviteCode ? (
                        <Button
                            onClick={handleGenerateCode}
                            disabled={isLoading}
                            className="bg-otter-blue hover:bg-otter-blue/90"
                        >
                            {isLoading ? "Generating..." : "Generate Invite Code"}
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            {/* Invite Code Display */}
                            <div className="bg-white rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                        Invite Code
                                    </p>
                                    <p className="text-2xl font-bold font-quicksand tracking-widest text-otter-blue">
                                        {inviteCode}
                                    </p>
                                </div>
                                <Button
                                    onClick={handleCopy}
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12"
                                >
                                    {copied ? (
                                        <Check className="w-5 h-5 text-otter-mint" />
                                    ) : (
                                        <Copy className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>

                            {/* Share Link */}
                            <p className="text-sm text-gray-500 font-nunito">
                                Or share this link: {" "}
                                <button
                                    onClick={handleCopy}
                                    className="text-otter-blue underline hover:no-underline"
                                >
                                    {window.location.origin}/invite?code={inviteCode}
                                </button>
                            </p>

                            {/* QR Code Placeholder */}
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <QrCode className="w-4 h-4" />
                                <span>QR Code coming soon</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
