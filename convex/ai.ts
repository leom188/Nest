import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Query to check for a valid cached summary.
// Returns null if: no cache, >7 days old, stale (significant event), or it's the 1st of the month.
export const getCachedSummary = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const cached = await ctx.db
            .query("ai_summaries")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .first();

        if (!cached) return null;

        const now = new Date();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const isFirstOfMonth = now.getDate() === 1;
        const isOlderThanWeek = Date.now() - cached.generatedAt > sevenDaysMs;
        const isStale = cached.stale === true;

        // Generated in a previous month (but not yet the 1st of the new month would be caught by isStale)
        const cachedDate = new Date(cached.generatedAt);
        const isFromPreviousMonth =
            cachedDate.getMonth() !== now.getMonth() ||
            cachedDate.getFullYear() !== now.getFullYear();

        if (isStale || isOlderThanWeek || isFirstOfMonth || isFromPreviousMonth) {
            return null; // trigger regeneration
        }

        return { summary: cached.summary, generatedAt: cached.generatedAt };
    },
});

// Mutation to save a fresh summary (replaces any existing entry for this workspace)
export const saveSummary = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        summary: v.string(),
        dayKey: v.string(),
    },
    handler: async (ctx, args) => {
        // Remove old entries
        const old = await ctx.db
            .query("ai_summaries")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();
        for (const entry of old) await ctx.db.delete(entry._id);

        await ctx.db.insert("ai_summaries", {
            workspaceId: args.workspaceId,
            summary: args.summary,
            generatedAt: Date.now(),
            dayKey: args.dayKey,
            stale: false,
        });
    },
});

// Called by expenses.ts when a significant expense is added
export const markSummaryStale = mutation({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const cached = await ctx.db
            .query("ai_summaries")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .first();
        if (cached) {
            await ctx.db.patch(cached._id, { stale: true });
        }
    },
});

export const generateSpendingSummary = action({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        // 1. Auth & premium check
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.runQuery(api.users.current);
        if (!user || user.subscriptionTier !== "premium") {
            throw new Error("AI Spending Summary is a premium feature.");
        }

        // 2. Check daily cache (inlined to avoid circular reference with getCachedSummary)
        const today = new Date().toISOString().slice(0, 10);
        const cachedSummaries = await ctx.runQuery(api.ai.getCachedSummary, { workspaceId: args.workspaceId }) as { summary: string; generatedAt: number } | null;
        if (cachedSummaries) {
            return cachedSummaries;
        }

        // 3. Fetch data
        const spending: Array<{ name: string; emoji: string; amount: number }> =
            await ctx.runQuery(api.expenses.getSpendingByCategory, { workspaceId: args.workspaceId });
        const trend: Array<{ month: string; amount: number }> =
            await ctx.runQuery(api.expenses.getSpendingTrend, { workspaceId: args.workspaceId, months: 3 });

        if (spending.length === 0) {
            return { summary: "No expenses logged this month yet. Start adding your expenses and come back — I'll have some helpful insights for you! 🌱", generatedAt: Date.now() };
        }

        const monthName = new Date().toLocaleString("default", { month: "long" });
        const totalSpent = spending.reduce((s, c) => s + c.amount, 0);
        const topCategories = spending.slice(0, 5).map(c => `${c.name}: $${c.amount.toFixed(2)}`).join(", ");
        const trendText = trend.length > 0
            ? trend.map(t => `${t.month}: $${t.amount.toFixed(2)}`).join(", ")
            : "No previous months to compare yet.";
        const hasPreviousData = trend.some(t => t.amount > 0 && t.month !== monthName.slice(0, 3));

        const systemPrompt = `You are Nest, a warm and supportive personal finance buddy — not an advisor, a friend.

Write a short, conversational check-in about the user's spending (3-4 sentences max). Follow these rules:
- Use the month name "${monthName}" naturally (e.g. "This ${monthName}..." or "So far in ${monthName}...")
- Start with something encouraging or acknowledging — never start with "It looks like..."
- Mention the top 1-2 spending categories by name with their dollar amounts
- ${hasPreviousData ? "Compare briefly to previous months if there's an interesting pattern" : "Don't force comparisons if there's no previous data — just focus on this month"}
- End with one specific, actionable micro-tip that's directly relevant to their top category (not generic advice)
- Be warm, casual, and specific. Use contractions. No bullet points, no numbered lists
- Do NOT use markdown formatting, emojis, or special characters. Plain text only
- Keep it concise — quality over quantity`;

        const userMessage = `Here's my spending for ${monthName}:
Total spent: $${totalSpent.toFixed(2)}
Categories: ${topCategories}
Recent trend: ${trendText}`;

        const apiKey = process.env.ZAI_API_KEY;
        if (!apiKey) throw new Error("AI service is not configured.");

        const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "GLM-4.7-Flash",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage },
                ],
                temperature: 0.7,
                max_tokens: 2048,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("GLM API Error:", err);
            throw new Error("Failed to generate spending summary.");
        }

        const data = await response.json();

        // GLM-4.7-Flash is a reasoning model: the final answer is in `content`.
        // NEVER fall back to `reasoning_content` — that's the raw chain-of-thought
        // and should never be shown to users. If content is empty, the model ran out
        // of tokens; throw so the frontend shows a clean retry message.
        const choice = data.choices?.[0]?.message;
        const summary = choice?.content?.trim();

        if (!summary) {
            console.error("Empty content from GLM (likely hit max_tokens during reasoning):", data.choices?.[0]?.finish_reason);
            throw new Error("The AI is thinking too hard — please try again in a moment.");
        }

        // 4. Cache the summary for today
        await ctx.runMutation(api.ai.saveSummary, {
            workspaceId: args.workspaceId,
            summary,
            dayKey: today,
        });

        return { summary, generatedAt: Date.now() };
    },
});


export const processTranscript = action({
    args: {
        transcript: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Verify Authentication & Premium
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.runQuery(api.users.current);
        if (!user || user.subscriptionTier !== "premium") {
            throw new Error("Voice input is a premium feature. Please upgrade to use this feature.");
        }

        const transcript = args.transcript.trim();
        if (!transcript) {
            throw new Error("Empty transcript");
        }

        const categories = await ctx.runQuery(api.expenses.getCategories);
        const validCategoryIds = categories.map((c: { id: string }) => c.id);

        // STOYRY 2: Regex parsing attempt
        // Look for simple patterns like "45 Uber", "12 coffee", "80 rent"
        // If there are multiple numbers or the word "and", bypass regex to let LLM handle multiple expenses
        const numberMatches = transcript.match(/\d+(?:\.\d+)?/g);
        const hasMultipleNumbers = numberMatches && numberMatches.length > 1;
        const hasAnd = /\band\b/i.test(transcript);

        if (!hasMultipleNumbers && !hasAnd) {
            const match = transcript.match(/^(\d+(?:\.\d+)?)(?:\s+dollars?)?\s+(.+)$/i) ||
                transcript.match(/(?:i spent\s+)?(\d+(?:\.\d+)?)(?:\s+dollars?)?\s+(?:on|for|at)?\s+(.+)$/i);

            if (match) {
                const amount = parseFloat(match[1]);
                const rest = match[2].toLowerCase().trim();
                // simple mapping
                let determinedCategory = null;
                if (rest.includes("uber") || rest.includes("lyft") || rest.includes("taxi")) determinedCategory = "transport";
                else if (rest.includes("coffee") || rest.includes("starbuck") || rest.includes("lunch") || rest.includes("pizza") || rest.includes("food")) determinedCategory = "dining";
                else if (rest.includes("walmart") || rest.includes("groceries") || rest.includes("costco")) determinedCategory = "groceries";
                else if (rest.includes("rent") || rest.includes("mortgage")) determinedCategory = "rent";
                else if (rest.includes("gym") || rest.includes("netflix") || rest.includes("spotify")) determinedCategory = "subscriptions";

                if (determinedCategory && !Number.isNaN(amount)) {
                    return {
                        expenses: [{
                            amount,
                            description: match[2].trim(), // original casing mostly
                            category: determinedCategory,
                            date: Date.now()
                        }],
                        parsedBy: "regex"
                    };
                }
            }
        }

        // 3. Extract Expenses (gpt-4o-mini)
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("AI endpoints are not configured (Missing OPENAI_API_KEY).");
        }

        const now = new Date();

        const systemPrompt = `You are a helpful financial assistant. Extract expenses from the user's input.
The user might mention one or multiple expenses.
Return the result as a JSON array of objects.
Each object must have:
- "amount": a number
- "description": a brief string describing the expense
- "category": one of the following exact string values: [${validCategoryIds.join(", ")}]. If unsure, use "other".
- "date": the unix timestamp in milliseconds for when the expense occurred. Use the current time (${now.getTime()}) if not specified, or adjust relatively if they say "yesterday", etc.

Respond ONLY with a valid JSON array. Do not include markdown formatting like \`\`\`json. Return just the JSON array. Example: [{"amount": 50, "description": "Walmart groceries", "category": "groceries", "date": 1700000000000}]`;

        const llmResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: transcript }
                ]
            })
        });

        if (!llmResponse.ok) {
            const errorText = await llmResponse.text();
            console.error("LLM Error:", errorText);
            try {
                const parsed = JSON.parse(errorText);
                throw new Error(`AI Error: ${parsed.error?.message || errorText}`);
            } catch {
                throw new Error(`Failed to categorize expenses: ${errorText}`);
            }
        }

        const llmData = await llmResponse.json();
        let parsedExpenses = [];
        try {
            let jsonText = llmData.choices[0].message.content.trim();
            // Just in case it returns markdown
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
            }
            parsedExpenses = JSON.parse(jsonText);
        } catch {
            console.error("Failed to parse LLM JSON:", llmData.choices[0].message.content);
            throw new Error("Failed to understand the categorized expenses.");
        }

        return {
            expenses: parsedExpenses,
            parsedBy: "llm"
        };
    }
});
