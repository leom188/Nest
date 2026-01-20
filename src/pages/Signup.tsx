"use client";

import { useState } from "react";
import { AuthForm } from "../components/auth/AuthForm";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "react-router-dom";

export function Signup() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const navigate = useNavigate();
  const { signIn } = useAuthActions();

  const handleSubmit = async (data: { email: string; password: string; name?: string }) => {
    setIsPending(true);
    setError(undefined);

    try {
      await signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signUp",
        ...(data.name ? { name: data.name } : {}),
      });
      // Correct flow handles redirect automatically or we just redirect to root
      // Usually sign in with Convex Auth handles token storage automatically
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-otter-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForm
          mode="signup"
          onSubmit={handleSubmit}
          isPending={isPending}
          error={error}
        />
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
