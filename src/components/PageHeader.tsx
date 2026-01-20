"use client";

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
    title: string;
    showBack?: boolean;
}

export function PageHeader({ title, showBack = true }: PageHeaderProps) {
    const navigate = useNavigate();

    return (
        <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4 sticky top-0 z-40 safe-top">
            {showBack && (
                <button
                    onClick={() => navigate("/")}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 lg:hidden"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
            )}
            <div className="flex-1">
                <h1 className="text-xl font-bold font-quicksand text-otter-blue">
                    {title}
                </h1>
            </div>
            <div className="w-10 h-10 bg-otter-blue/10 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/icons/logo.png" alt="Nest Logo" className="w-8 h-8 object-contain" />
            </div>
        </div>
    );
}
