"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, DollarSign, Palette, ChevronRight, LogOut, Moon, Sun, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { PageHeader } from "../components/PageHeader";

const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "CAD", symbol: "$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "$", name: "Australian Dollar" },
    { code: "MXN", symbol: "$", name: "Mexican Peso" },
];

import { useAuthActions } from "@convex-dev/auth/react";

export function MenuPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { signOut } = useAuthActions();
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState("USD");
    const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

    const handleLogout = async () => {
        await signOut();
        logout();
        localStorage.removeItem("nest_user");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-otter-white safe-all pb-24">
            <PageHeader title="Menu" />

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* About You Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-otter shadow-soft overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-bold font-quicksand text-gray-400 uppercase tracking-wide">
                            About You
                        </h2>
                    </div>

                    {/* Profile Row */}
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 bg-otter-blue/10 rounded-full flex items-center justify-center">
                            {user?.imageUrl ? (
                                <img
                                    src={user.imageUrl}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-6 h-6 text-otter-blue" />
                            )}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-bold font-quicksand text-gray-800">
                                {user?.name || "User"}
                            </p>
                            <p className="text-sm text-gray-400 font-nunito">
                                {user?.email}
                            </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors text-otter-pink"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold font-nunito">Log Out</span>
                    </button>
                </motion.div>

                {/* Preferences Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-otter shadow-soft overflow-hidden"
                >
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="text-sm font-bold font-quicksand text-gray-400 uppercase tracking-wide">
                            Preferences
                        </h2>
                    </div>

                    {/* Currency */}
                    <button
                        onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-10 h-10 bg-otter-mint/10 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-otter-mint" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-bold font-quicksand text-gray-800">Currency</p>
                            <p className="text-sm text-gray-400 font-nunito">
                                {currencies.find((c) => c.code === selectedCurrency)?.name || "US Dollar"}
                            </p>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform ${showCurrencyPicker ? "rotate-90" : ""}`} />
                    </button>

                    {showCurrencyPicker && (
                        <div className="border-t border-gray-100 bg-gray-50">
                            {currencies.map((currency) => (
                                <button
                                    key={currency.code}
                                    onClick={() => {
                                        setSelectedCurrency(currency.code);
                                        setShowCurrencyPicker(false);
                                    }}
                                    className={`w-full flex items-center gap-4 p-4 hover:bg-white transition-colors ${selectedCurrency === currency.code ? "bg-white" : ""
                                        }`}
                                >
                                    <span className="w-8 text-center font-bold text-gray-600">
                                        {currency.symbol}
                                    </span>
                                    <span className="flex-1 text-left font-nunito">
                                        {currency.name}
                                    </span>
                                    {selectedCurrency === currency.code && (
                                        <span className="text-otter-blue font-bold">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Theme */}
                    <div className="p-4 border-t border-gray-100">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-otter-lavender/10 rounded-xl flex items-center justify-center">
                                <Palette className="w-5 h-5 text-otter-lavender" />
                            </div>
                            <p className="font-bold font-quicksand text-gray-800">Theme</p>
                        </div>
                        <div className="flex gap-2">
                            {[
                                { id: "light", icon: Sun, label: "Light" },
                                { id: "dark", icon: Moon, label: "Dark" },
                                { id: "system", icon: Monitor, label: "System" },
                            ].map((option) => {
                                const Icon = option.icon;
                                const isActive = theme === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => setTheme(option.id as "light" | "dark" | "system")}
                                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${isActive
                                            ? "bg-otter-blue text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-xs font-bold">{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* App Version */}
                <div className="text-center py-4">
                    <p className="text-sm text-gray-300 font-nunito">
                        Nest v1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
}
