"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthForm } from "../components/auth/AuthForm";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "react-router-dom";

export function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const navigate = useNavigate();
  const { signIn } = useAuthActions();

  const handleSubmit = async (data: { email: string; password: string; name?: string }) => {
    setIsPending(true);
    setError(undefined);

    try {
      if (mode === "signup") {
        await signIn("password", {
          email: data.email,
          password: data.password,
          flow: "signUp",
          ...(data.name ? { name: data.name } : {}),
        });
      } else {
        await signIn("password", {
          email: data.email,
          password: data.password,
          flow: "signIn",
        });
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsPending(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-screen items-center justify-center p-4 bg-otter-white"
      >
        <div className="w-full max-w-md">
          <AuthForm
            mode={mode}
            onSubmit={handleSubmit}
            isPending={isPending}
            error={error}
          />
          <div className="mt-4 text-center">
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
