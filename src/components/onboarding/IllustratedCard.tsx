"use client";

import { motion } from "framer-motion";
import { LucideIcon, Lock, Crown } from "lucide-react";

interface IllustratedCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    selected?: boolean;
    onClick: () => void;
}

export function IllustratedCard({
    icon: Icon,
    title,
    description,
    selected,
    onClick,
}: IllustratedCardProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`w-full p-6 rounded-otter text-left transition-all ${selected
                    ? "bg-otter-blue text-white shadow-lg ring-4 ring-otter-blue/30"
                    : "bg-white shadow-soft hover:shadow-lg border border-otter-lavender/20"
                }`}
        >
            <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${selected ? "bg-white/20" : "bg-otter-blue/10"
                    }`}
            >
                <Icon
                    className={`w-8 h-8 ${selected ? "text-white" : "text-otter-blue"}`}
                />
            </div>
            <h3
                className={`text-xl font-bold font-quicksand mb-2 ${selected ? "text-white" : "text-gray-800"
                    }`}
            >
                {title}
            </h3>
            <p
                className={`font-nunito ${selected ? "text-white/80" : "text-gray-500"
                    }`}
            >
                {description}
            </p>
        </motion.button>
    );
}

interface PremiumIllustratedCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    onUpgrade?: () => void;
}

export function PremiumIllustratedCard({
    icon: Icon,
    title,
    description,
    onUpgrade,
}: PremiumIllustratedCardProps) {
    return (
        <motion.div
            className="w-full p-6 rounded-otter text-left bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-soft relative overflow-hidden"
        >
            {/* Premium badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs font-bold">
                <Crown className="w-3 h-3" />
                PREMIUM
            </div>

            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-amber-100 relative">
                <Icon className="w-8 h-8 text-amber-600" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <Lock className="w-3 h-3 text-white" />
                </div>
            </div>

            <h3 className="text-xl font-bold font-quicksand mb-2 text-gray-800">
                {title}
            </h3>
            <p className="font-nunito text-gray-600 mb-4 leading-relaxed">
                {description}
            </p>

            <div className="text-center">
                <div className="text-xs text-amber-600 font-medium mb-2">
                    Includes all Personal features plus:
                </div>
                <div className="text-xs text-gray-600 space-y-1 mb-4">
                    <div>• Joint workspaces for shared expenses</div>
                    <div>• AI-powered insights & analytics</div>
                    <div>• Voice expense entry</div>
                    <div>• Advanced budget tracking</div>
                </div>
                <button
                    onClick={onUpgrade}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg"
                >
                    Upgrade Now - $7.99/mo
                </button>
            </div>
        </motion.div>
    );
}