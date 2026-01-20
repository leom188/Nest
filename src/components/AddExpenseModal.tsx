"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Calendar, DollarSign, Repeat } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useAuthStore } from "../stores/authStore";

interface AddExpenseModalProps {
    workspaceId: Id<"workspaces">;
    isOpen: boolean;
    onClose: () => void;
    editingExpense?: {
        _id: string;
        amount: number;
        description: string;
        category: string;
        date: number;
        isRecurring?: boolean;
    } | null;
}

export function AddExpenseModal({
    workspaceId,
    isOpen,
    onClose,
    editingExpense,
}: AddExpenseModalProps) {
    const { user } = useAuthStore();
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("other");
    const [date, setDate] = useState<Date>();
    const [isRecurring, setIsRecurring] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const categories = useQuery(api.expenses.getCategories);
    const createExpense = useMutation(api.expenses.createExpense);
    const updateExpense = useMutation(api.expenses.updateExpense);

    const isEditing = !!editingExpense;
    const selectedCategory = categories?.find((c: any) => c.id === category);

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
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !amount || !description || !date) return;

        setIsLoading(true);
        try {
            if (isEditing && editingExpense) {
                // Update existing expense
                await updateExpense({
                    expenseId: editingExpense._id as Id<"expenses">,
                    amount: parseFloat(amount),
                    description,
                    category,
                    date: date.getTime(),
                    isRecurring,
                });
            } else {
                // Create new expense
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

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md mx-auto bg-white rounded-otter shadow-soft border-0 p-0">
                <DialogHeader className="px-6 py-4">
                    <DialogTitle className="text-xl font-bold font-quicksand text-gray-800">
                        {isEditing ? "Edit Expense" : "Add Expense"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
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
                                    autoFocus
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
                                {categories?.map((cat: any) => (
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
                        disabled={isLoading || !amount || !description || !date}
                        className="w-full h-14 text-lg font-bold bg-otter-blue hover:bg-otter-blue/90 rounded-otter shadow-soft"
                    >
                        {isLoading ? "Saving..." : isEditing ? "Update Expense" : "Add Expense"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}


