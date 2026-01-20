"use client";

import { useLocation, useNavigate } from "react-router-dom";
import { Home, BarChart3, Calendar, Menu } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
    onAddExpense: () => void;
    isAddDisabled?: boolean;
}

export function BottomNav({ onAddExpense, isAddDisabled }: BottomNavProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        {
            id: "home",
            icon: Home,
            label: "Home",
            path: "/",
        },
        {
            id: "insights",
            icon: BarChart3,
            label: "Insights",
            path: "/insights",
        },
        {
            id: "add",
            label: "Add",
            isPrimary: true,
            action: onAddExpense,
        },
        {
            id: "plan",
            icon: Calendar,
            label: "Plan",
            path: "/plan",
        },
        {
            id: "menu",
            icon: Menu,
            label: "Menu",
            path: "/menu",
        },
    ];

    const isActive = (path?: string) => {
        if (!path) return false;
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };


    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 bottom-nav safe-x z-50">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    if (item.isPrimary) {
                        return (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileTap={isAddDisabled ? {} : { scale: 0.9 }}
                                onClick={item.action}
                                disabled={isAddDisabled}
                                className={`relative -top-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isAddDisabled
                                    ? "bg-gray-200 cursor-not-allowed opacity-50 grayscale"
                                    : "bg-otter-blue hover:shadow-xl active:scale-95"
                                    }`}
                                aria-label="Add expense"
                            >
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </motion.button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => item.path && navigate(item.path)}
                            className={`flex flex-col items-center justify-center w-16 h-full transition-colors relative ${active
                                ? "text-otter-blue"
                                : "text-gray-400 hover:text-otter-blue"
                                }`}
                            aria-label={item.label}
                        >
                            {Icon && <Icon className="w-6 h-6 mb-1" strokeWidth={active ? 2.5 : 2} />}
                            <span className={`text-xs font-nunito ${active ? "font-bold" : ""}`}>
                                {item.label}
                            </span>
                            {active && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute top-0 w-8 h-1 bg-otter-blue rounded-b-full"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
