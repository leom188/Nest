import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

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
