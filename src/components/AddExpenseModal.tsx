"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, DollarSign, Repeat, Mic, Square, Loader2, Sparkles, Check, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface AddExpenseModalProps {
    workspaceId: Id<"workspaces">;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editingExpense?: {
        _id: string;
        amount: number;
        description: string;
        category: string;
        date: number;
        isRecurring?: boolean;
    } | null;
}

interface AIExpense {
    id: string;
    amount: number;
    description: string;
    category: string;
    date: number;
}

export function AddExpenseModal({
    workspaceId,
    isOpen,
    onClose,
    onSuccess,
    editingExpense,
}: AddExpenseModalProps) {
    const user = useQuery(api.users.current);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("other");
    const [date, setDate] = useState<Date>();
    const [isRecurring, setIsRecurring] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // AI / Voice State
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [isWaitingForMicrophone, setIsWaitingForMicrophone] = useState(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [aiExtractedExpenses, setAiExtractedExpenses] = useState<AIExpense[]>([]);

    const categories = useQuery(api.expenses.getCategories);
    const createExpense = useMutation(api.expenses.createExpense);
    const updateExpense = useMutation(api.expenses.updateExpense);
    const processVoice = useAction(api.ai.processVoiceExpense);
    const createMultipleExpenses = useMutation(api.expenses.createMultipleExpenses);

    const isEditing = !!editingExpense;
    const selectedCategory = categories?.find((c: { id: string }) => c.id === category);

    useEffect(() => {
        if (editingExpense) {
            setAmount(editingExpense.amount.toString());
            setDescription(editingExpense.description);
            setCategory(editingExpense.category);
            setDate(new Date(editingExpense.date));
            setIsRecurring(editingExpense.isRecurring || false);
        } else {
            // Reset to defaults for new expense
            setAmount("");
            setDescription("");
            setCategory("other");
            setDate(new Date());
            setIsRecurring(false);
        }
    }, [editingExpense]);

    const resetForm = () => {
        setAmount("");
        setDescription("");
        setCategory("other");
        setDate(new Date());
        setIsRecurring(false);
    };

    const handleClose = () => {
        resetForm();
        setAiExtractedExpenses([]);
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
        }
        setIsRecording(false);
        setAiProcessing(false);
        setIsWaitingForMicrophone(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (user === undefined) return; // Loading
        if (user === null) return; // Not logged in
        if (!amount || !description || !date) return;

        setIsLoading(true);
        try {
            if (isEditing && editingExpense) {
                await updateExpense({
                    expenseId: editingExpense._id as Id<"expenses">,
                    amount: parseFloat(amount),
                    description,
                    category,
                    date: date.getTime(),
                    isRecurring,
                });
            } else {
                await createExpense({
                    workspaceId,
                    amount: parseFloat(amount),
                    description,
                    category,
                    date: date.getTime(),
                    isRecurring,
                });
            }

            handleClose();
            onSuccess?.();
        } catch (error) {
            console.error("Failed to save expense:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmountChange = (value: string) => {
        const cleaned = value.replace(/[^0-9.]/g, "");
        const parts = cleaned.split(".");
        if (parts.length > 2) return;
        if (parts[1]?.length > 2) return;
        setAmount(cleaned);
    };

    // --- Voice processing logic ---
    const startRecording = async () => {
        try {
            console.log("Add with voice button clicked. Requesting microphone...");
            setIsWaitingForMicrophone(true);
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Your browser does not support audio recording. Are you using a secure context (HTTPS/localhost)?");
                setIsWaitingForMicrophone(false);
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsWaitingForMicrophone(false);
            setMediaStream(stream);

            let mimeType = 'audio/webm';
            let options: MediaRecorderOptions = {};
            if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
                options = { mimeType };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
                options = { mimeType };
            }

            const recorder = new MediaRecorder(stream, options);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                stream.getTracks().forEach((track) => track.stop());
                setMediaStream(null);
                handleAudioSubmission(blob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err: unknown) {
            setIsWaitingForMicrophone(false);
            console.error("Could not start recording:", err);
            alert("Could not access microphone: " + ((err as Error).message || "Unknown error"));
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleAudioSubmission = (blob: Blob) => {
        setAiProcessing(true);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            try {
                const expenses = await processVoice({
                    audioBase64: base64data,
                    mimeType: blob.type || 'audio/webm',
                });
                setAiExtractedExpenses(expenses.map((e: Omit<AIExpense, "id">, i: number) => ({ ...e, id: `ai-${Date.now()}-${i}` })));
            } catch (error: unknown) {
                console.error("AI processing failed", error);
                alert((error as Error).message || "Failed to process audio.");
            } finally {
                setAiProcessing(false);
            }
        };
    };

    const handleConfirmAIExpenses = async () => {
        setIsLoading(true);
        try {
            await createMultipleExpenses({
                workspaceId,
                expenses: aiExtractedExpenses.map(e => ({
                    amount: e.amount,
                    description: e.description,
                    category: e.category,
                    date: e.date,
                    isRecurring: false
                }))
            });
            handleClose();
            onSuccess?.();
        } catch (error) {
            console.error("Failed to save AI expenses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeAiExpense = (id: string) => {
        setAiExtractedExpenses(current => current.filter(e => e.id !== id));
    };

    const updateAiExpense = (id: string, field: keyof AIExpense, value: string | number) => {
        setAiExtractedExpenses(current => current.map(e => e.id === id ? { ...e, [field]: value } : e));
    };


    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md mx-auto bg-white rounded-otter shadow-soft border-0 p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold font-quicksand text-gray-800">
                        {aiProcessing
                            ? "Analyzing Voice..."
                            : aiExtractedExpenses.length > 0
                                ? "Review AI Expenses"
                                : isEditing
                                    ? "Edit Expense"
                                    : "Add Expense"}
                    </DialogTitle>
                    <div id="dialog-desc" className="sr-only">
                        Form to add, edit, or speak an expense.
                    </div>
                </DialogHeader>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        {aiProcessing ? (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="p-12 flex flex-col items-center justify-center space-y-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-otter-blue/10 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-otter-blue animate-spin" />
                                </div>
                                <p className="text-gray-600 font-nunito text-center animate-pulse">
                                    Our AI goes brrr...<br />Categorizing your expenses
                                </p>
                            </motion.div>
                        ) : aiExtractedExpenses.length > 0 ? (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-6 max-h-[60vh] overflow-y-auto"
                            >
                                <div className="space-y-4 mb-6">
                                    {aiExtractedExpenses.map((exp) => (
                                        <div key={exp.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3 relative group">
                                            <button
                                                onClick={() => removeAiExpense(exp.id)}
                                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div className="flex gap-3 mt-4">
                                                <div className="flex-1 space-y-2">
                                                    <Input
                                                        value={exp.description}
                                                        onChange={(e) => updateAiExpense(exp.id, 'description', e.target.value)}
                                                        className="h-8 font-medium border-transparent hover:border-gray-200 focus:border-otter-blue transition-colors px-2"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Select value={exp.category} onValueChange={(val) => updateAiExpense(exp.id, 'category', val)}>
                                                            <SelectTrigger className="h-8 text-sm bg-white border-gray-200 min-w-[140px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white">
                                                                {categories?.map((cat: { id: string, name: string, emoji: string }) => (
                                                                    <SelectItem key={cat.id} value={cat.id}>
                                                                        <div className="flex items-center gap-2">
                                                                            <span>{cat.emoji}</span>
                                                                            <span>{cat.name}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="w-24 relative flex items-center justify-center">
                                                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-2" />
                                                    <Input
                                                        value={exp.amount}
                                                        onChange={(e) => updateAiExpense(exp.id, 'amount', parseFloat(e.target.value) || 0)}
                                                        className="h-8 font-bold pl-6 text-right border-transparent hover:border-gray-200 focus:border-otter-blue transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {aiExtractedExpenses.length === 0 && (
                                        <p className="text-center text-gray-500 py-4 font-nunito">All expenses removed.</p>
                                    )}
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <Button variant="outline" className="flex-1" onClick={() => setAiExtractedExpenses([])}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirmAIExpenses}
                                        disabled={isLoading || aiExtractedExpenses.length === 0}
                                        className="flex-1 bg-otter-blue hover:bg-otter-blue/90 font-bold"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                        Save All
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="px-6 pb-6 pt-4 space-y-6"
                            >
                                {/* Voice Integration for Premium Users */}
                                {user?.subscriptionTier === "premium" && !isEditing && (
                                    <div className="flex flex-col items-center justify-center mb-2 gap-2">
                                        {isWaitingForMicrophone && (
                                            <span className="text-sm text-otter-blue animate-pulse">
                                                Please allow microphone access...
                                            </span>
                                        )}
                                        <motion.button
                                            type="button"
                                            disabled={isWaitingForMicrophone}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`relative overflow-hidden group flex items-center justify-center gap-2 w-full py-3 rounded-2xl transition-all duration-300 ${isRecording
                                                ? "bg-red-50 text-red-600 border border-red-200 shadow-inner"
                                                : "bg-gradient-to-r from-otter-fresh/10 to-otter-blue/10 text-otter-blue hover:from-otter-fresh/20 hover:to-otter-blue/20 border border-otter-blue/10 shadow-sm"
                                                } ${isWaitingForMicrophone ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            {isRecording ? (
                                                <>
                                                    <span className="absolute inset-0 bg-red-500/10 animate-pulse" />
                                                    <Square className="w-5 h-5 fill-current" />
                                                    <span className="font-bold relative z-10 font-quicksand">Stop Recording</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 absolute top-2 right-2 text-otter-blue/40" />
                                                    {isWaitingForMicrophone ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                                                    <span className="font-bold font-quicksand">
                                                        {isWaitingForMicrophone ? "Requesting Mic..." : "Add with Voice"}
                                                    </span>
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                )}

                                {/* Amount Input - Prominent, centered */}
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700 text-center block">
                                        Amount
                                    </Label>
                                    <div className="relative flex items-center justify-center">
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="w-8 h-8 text-gray-400 -mr-2" />
                                            <Input
                                                id="amount"
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="0.00"
                                                value={amount}
                                                onChange={(e) => handleAmountChange(e.target.value)}
                                                className="text-4xl font-bold text-center h-20 bg-transparent border-0 shadow-none focus-visible:ring-0 p-0 w-[200px]"
                                                autoFocus={!isRecording}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                        Description
                                    </Label>
                                    <Input
                                        id="description"
                                        type="text"
                                        placeholder="What was it for?"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="text-lg h-12"
                                        required
                                    />
                                </div>

                                {/* Category Selector */}
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                                        Category
                                    </Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="w-full h-14 bg-white border-otter-lavender/20 rounded-otter shadow-soft hover:shadow-lg transition-all">
                                            <SelectValue placeholder="Select a category">
                                                {selectedCategory && (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{selectedCategory.emoji}</span>
                                                        <span className="font-nunito">{selectedCategory.name}</span>
                                                    </div>
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white rounded-otter shadow-soft border border-otter-lavender/20">
                                            {categories?.map((cat: { id: string; emoji: string; name: string }) => (
                                                <SelectItem key={cat.id} value={cat.id} className="hover:bg-otter-blue/5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{cat.emoji}</span>
                                                        <span className="font-nunito">{cat.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date Picker - shadcn/ui Calendar */}
                                <div className="space-y-2">
                                    <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                                        Date
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <motion.button
                                                id="date"
                                                type="button"
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                className="w-full flex items-center justify-start p-4 bg-white border border-otter-lavender/20 rounded-otter shadow-soft hover:shadow-lg transition-all h-14"
                                            >
                                                <Calendar className="mr-3 h-5 w-5 text-gray-400" />
                                                <span className="text-lg font-nunito text-left">
                                                    {date ? date.toLocaleDateString("en-US", {
                                                        month: "long",
                                                        day: "numeric",
                                                        year: "numeric"
                                                    }) : "Select date"}
                                                </span>
                                            </motion.button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white rounded-otter shadow-soft border border-otter-lavender/20">
                                            <CalendarComponent
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                className="rounded-otter"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Recurring Toggle */}
                                <div className="flex items-center justify-between p-4 bg-white border border-otter-lavender/20 rounded-otter shadow-soft hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRecurring ? "bg-otter-blue/10" : "bg-otter-lavender/10"
                                            }`}>
                                            <Repeat className={`w-5 h-5 ${isRecurring ? "text-otter-blue" : "text-gray-400"}`} />
                                        </div>
                                        <Label htmlFor="recurring" className={`font-nunito text-lg cursor-pointer ${isRecurring ? "text-otter-blue font-bold" : "text-gray-700"}`}>
                                            Recurring Expense
                                        </Label>
                                    </div>
                                    <Switch
                                        id="recurring"
                                        checked={isRecurring}
                                        onCheckedChange={setIsRecurring}
                                    />
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || !amount || !description || !date || isRecording}
                                    className="w-full h-14 text-lg font-bold bg-otter-blue hover:bg-otter-blue/90 rounded-otter shadow-soft"
                                >
                                    {isLoading ? "Saving..." : isEditing ? "Update Expense" : "Add Expense"}
                                </Button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
