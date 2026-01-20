"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Loader2, DollarSign, PiggyBank } from "lucide-react";

interface CreateWorkspaceProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateWorkspace({ onSuccess, onCancel }: CreateWorkspaceProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"split" | "joint">("split");
  const [currency, setCurrency] = useState("USD");
  const [splitMethod, setSplitMethod] = useState<"50/50" | "income" | "custom">("50/50");
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuthStore();
  const createWorkspace = useMutation(api.workspaces.createWorkspace);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setIsLoading(true);
    try {
      await createWorkspace({
        name: name.trim(),
        type,
        currency,
        splitMethod,
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-otter-blue/10 backdrop-blur-[2px]"
    >
      <div className="absolute inset-0" onClick={onCancel} />

      <Card className="w-full max-w-md relative bg-white border-none shadow-soft rounded-otter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-quicksand text-otter-blue text-2xl">
            <PiggyBank className="h-6 w-6" />
            Create Workspace
          </CardTitle>
          <CardDescription className="font-nunito text-gray-400">
            Set up a new workspace for tracking expenses and finances.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Workspace Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Workspace Name</label>
              <Input
                placeholder="e.g., My Apartment"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-otter-white border-otter-lavender/30 focus:border-otter-blue rounded-xl h-11"
              />
            </div>

            {/* Workspace Type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("split")}
                  className={`p-4 rounded-otter border-2 transition-all flex flex-col items-center text-center ${type === "split"
                    ? "bg-otter-blue/5 border-otter-blue"
                    : "bg-white border-otter-lavender/20 hover:border-otter-lavender/40"
                    }`}
                >
                  <div className={`p-2 rounded-full mb-2 ${type === "split" ? "bg-otter-blue text-white" : "bg-otter-blue/10 text-otter-blue"}`}>
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-bold ${type === "split" ? "text-otter-blue" : "text-gray-700"}`}>Split Bills</span>
                  <p className="text-[10px] text-gray-400 mt-1">Track shared expenses</p>
                </button>

                <button
                  type="button"
                  onClick={() => setType("joint")}
                  className={`p-4 rounded-otter border-2 transition-all flex flex-col items-center text-center ${type === "joint"
                    ? "bg-otter-blue/5 border-otter-blue"
                    : "bg-white border-otter-lavender/20 hover:border-otter-lavender/40"
                    }`}
                >
                  <div className={`p-2 rounded-full mb-2 ${type === "joint" ? "bg-otter-blue text-white" : "bg-otter-blue/10 text-otter-blue"}`}>
                    <PiggyBank className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-bold ${type === "joint" ? "text-otter-blue" : "text-gray-700"}`}>Joint Savings</span>
                  <p className="text-[10px] text-gray-400 mt-1">Collective goals</p>
                </button>
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-otter-white border border-otter-lavender/30 focus:border-otter-blue text-sm font-medium"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>

            {/* Split Method (only for split type) */}
            {type === "split" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Split Method</label>
                <select
                  value={splitMethod}
                  onChange={(e) => setSplitMethod(e.target.value as "50/50" | "income" | "custom")}
                  className="w-full h-11 px-3 rounded-xl bg-otter-white border border-otter-lavender/30 focus:border-otter-blue text-sm font-medium"
                >
                  <option value="50/50">50/50 Split</option>
                  <option value="income">Based on Income</option>
                  <option value="custom">Custom Split</option>
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 rounded-otter border-otter-lavender/30 text-gray-600 font-bold h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="flex-1 bg-otter-blue hover:bg-otter-blue/90 text-white rounded-otter shadow-soft h-11 font-bold transition-all active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
