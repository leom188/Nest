"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface CelebrationProps {
    show: boolean;
    onComplete: () => void;
    message: string;
}

export function Celebration({ show, onComplete, message }: CelebrationProps) {
    const [confettiParticles, setConfettiParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

    useEffect(() => {
        if (show) {
            const colors = ["#6C5CE7", "#74B9FF", "#00B894", "#FDCB6E", "#E17055"];
            const particles = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: -20,
                color: colors[Math.floor(Math.random() * colors.length)],
            }));
            setConfettiParticles(particles);

            const timer = setTimeout(onComplete, 2000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-white rounded-otter shadow-soft p-8 max-w-sm w-full text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                className="w-20 h-20 bg-otter-mint/20 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <Check className="w-10 h-10 text-otter-mint" />
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl font-bold font-quicksand text-gray-800 mb-3"
                            >
                                Way to go! 🎉
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-gray-600 font-nunito mb-6"
                            >
                                {message}
                            </motion.p>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                onClick={onComplete}
                                className="mx-auto w-full py-3 rounded-full font-bold text-otter-blue hover:bg-otter-blue/10 transition-colors"
                            >
                                Continue
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    {confettiParticles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{
                                left: `${particle.x}%`,
                                top: "50%",
                                opacity: 1,
                                scale: 1,
                            }}
                            animate={{
                                top: `${particle.y}%`,
                                opacity: 0,
                                scale: 0,
                            }}
                            transition={{
                                duration: 1.5 + Math.random(),
                                ease: "easeOut",
                            }}
                            className="fixed w-3 h-3 rounded-full z-40"
                            style={{
                                backgroundColor: particle.color,
                            }}
                        />
                    ))}
                </>
            )}
        </AnimatePresence>
    );
}
