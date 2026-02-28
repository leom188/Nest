"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";

interface AppShellProps {
  children: ReactNode;
}

import { BottomNav } from "./BottomNav";
export function AppShell({ children }: AppShellProps) {

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-otter-white font-nunito"
    >
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
      <div className="mx-auto max-w-md w-full px-4 pb-24">
        {children}
      </div>
      <BottomNav />
    </motion.div>
  );
}


