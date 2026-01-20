"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2 } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>;
  isPending: boolean;
  error?: string;
}

export function AuthForm({ mode, onSubmit, isPending, error }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ email, password, name: mode === "signup" ? name : undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-center justify-center p-4"
    >
      <Card className="w-full max-w-md bg-white border-none shadow-soft rounded-otter overflow-hidden p-2">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-otter-blue/10 rounded-2xl flex items-center justify-center overflow-hidden">
              <img src="/icons/logo.png" alt="Nest Mascot" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-quicksand text-otter-blue">
            {mode === "login" ? "Welcome Back!" : "Join OtterLife"}
          </CardTitle>
          <CardDescription className="font-nunito text-gray-400 text-base">
            {mode === "login"
              ? "Sign in to your Nest account"
              : "Start managing your household finances with a smile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-bold text-gray-700">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-otter-white border-otter-lavender/30 focus:border-otter-blue rounded-xl h-11"
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-otter-white border-otter-lavender/30 focus:border-otter-blue rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-bold text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-otter-white border-otter-lavender/30 focus:border-otter-blue rounded-xl h-11"
              />
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-otter-pink font-bold bg-otter-pink/10 p-3 rounded-lg border border-otter-pink/20"
              >
                {error}
              </motion.div>
            )}
            <Button
              type="submit"
              className="w-full bg-otter-blue hover:bg-otter-blue/90 text-white rounded-otter shadow-soft h-12 font-bold transition-all active:scale-95 text-lg mt-4"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
