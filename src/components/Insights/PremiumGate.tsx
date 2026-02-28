"use client";

import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PremiumGateProps {
    title: string;
    description: string;
    children?: ReactNode; // blurred preview
    onUpgrade?: () => void;
}

export function PremiumGate({ title, description, children, onUpgrade }: PremiumGateProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl">
            {/* Blurred preview */}
            {children && (
                <div className="pointer-events-none select-none blur-sm opacity-60">
                    {children}
                </div>
            )}

            {/* Overlay */}
            <div className={`${children ? "absolute inset-0" : ""} bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-100 rounded-3xl flex flex-col items-center justify-center p-8 text-center`}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-5 h-5 text-indigo-500" />
                    </div>
                    <h3 className="font-bold font-quicksand text-gray-800 text-lg mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 font-nunito mb-5 text-balance">{description}</p>
                    <button
                        onClick={onUpgrade}
                        className="bg-[#4F46E5] text-white text-sm font-bold font-nunito px-6 py-3 min-h-[44px] rounded-xl hover:opacity-90 transition-opacity active:scale-95"
                    >
                        Upgrade to Premium
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
