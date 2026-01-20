"use client";

import { motion, useMotionValue, useTransform, PanInfo, animate } from "framer-motion";
import { useCallback, ReactNode, useRef } from "react";
import { useHaptic } from "../../hooks/useHaptic";
import { Trash2, Edit2 } from "lucide-react";

interface SwipeableRowProps {
    children: ReactNode;
    onLeftSwipe?: () => void; // Triggered when swiping left (typically Delete)
    onRightSwipe?: () => void; // Triggered when swiping right (typically Edit)
    onTap?: () => void;
    threshold?: number;
    className?: string;
}

const DEFAULT_THRESHOLD = 80;

export function SwipeableRow({
    children,
    onLeftSwipe,
    onRightSwipe,
    onTap,
    threshold = DEFAULT_THRESHOLD,
    className = "",
}: SwipeableRowProps) {
    const { impact } = useHaptic();
    const x = useMotionValue(0);
    const isDragging = useRef(false);

    // Reveal backgrounds based on swipe direction
    const editOpacity = useTransform(x, [10, 60], [0, 1]);
    const deleteOpacity = useTransform(x, [-60, -10], [1, 0]);

    const handleDragStart = () => {
        isDragging.current = true;
    };

    const handleDragEnd = useCallback(
        (_: unknown, info: PanInfo) => {
            const offset = info.offset.x;
            const velocity = info.velocity.x;

            // Trigger Swipe Left (typically Delete)
            if (onLeftSwipe && (offset < -threshold || velocity < -500)) {
                impact();
                onLeftSwipe();
            }
            // Trigger Swipe Right (typically Edit)
            else if (onRightSwipe && (offset > threshold || velocity > 500)) {
                impact();
                onRightSwipe();
            }
            
            // dragSnapToOrigin handles the return to 0 center
            // but we use animate for safety and to ensure it resets if logic above takes time
            animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
            
            setTimeout(() => {
                isDragging.current = false;
            }, 100);
        },
        [threshold, onLeftSwipe, onRightSwipe, impact, x]
    );

    const handleTap = useCallback(() => {
        if (!isDragging.current && onTap) {
            onTap();
        }
    }, [onTap]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Background Actions */}
            <div className="absolute inset-0 flex rounded-otter overflow-hidden pointer-events-none">
                {/* Right Swipe Background (reveals when dragging right - Edit) */}
                <motion.div 
                    style={{ opacity: editOpacity }}
                    className="absolute inset-y-0 left-0 w-1/2 bg-indigo-500 flex items-center justify-start pl-6"
                >
                    <Edit2 className="w-6 h-6 text-white" />
                </motion.div>

                {/* Left Swipe Background (reveals when dragging left - Delete) */}
                <motion.div 
                    style={{ opacity: deleteOpacity }}
                    className="absolute inset-y-0 right-0 w-1/2 bg-otter-pink flex items-center justify-end pr-6"
                >
                    <Trash2 className="w-6 h-6 text-white" />
                </motion.div>
            </div>

            {/* Foreground Content */}
            <motion.div
                style={{ x }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                dragSnapToOrigin
                whileDrag={{ scale: 0.98 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTap={handleTap}
                className="relative z-10 bg-white cursor-pointer active:cursor-grabbing rounded-otter"
            >
                {children}
            </motion.div>
        </div>
    );
}
