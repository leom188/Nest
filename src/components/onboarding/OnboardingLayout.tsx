"use client";

import { motion } from "framer-motion";
import { Toaster } from "sonner";

interface OnboardingLayoutProps {
    children: React.ReactNode;
    step: number;
    totalSteps: number;
    title: string;
    subtitle?: string;
}

export function OnboardingLayout({
    children,
    step,
    totalSteps,
    title,
    subtitle,
}: OnboardingLayoutProps) {
    return (
        <div className="min-h-screen bg-otter-white flex flex-col items-center justify-center p-6">
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        fontFamily: 'Nunito, sans-serif',
                        borderRadius: '1.25rem',
                        padding: '1rem',
                    },
                }}
            />
            {/* Progress Dots */}
            <div className="flex gap-2 mb-8">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all ${i < step
                            ? "bg-otter-blue"
                            : i === step
                                ? "bg-otter-blue/50 scale-125"
                                : "bg-otter-lavender/30"
                            }`}
                    />
                ))}
            </div>

            {/* Title Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
            >
                <h1 className="text-3xl md:text-4xl font-bold font-quicksand text-otter-blue mb-2">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-gray-500 font-nunito text-lg">{subtitle}</p>
                )}
            </motion.div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full max-w-2xl"
            >
                {children}
            </motion.div>
        </div>
    );
}
