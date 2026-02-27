import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const processVoiceExpense = action({
    args: {
        audioBase64: v.string(),
        mimeType: v.string(),
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

        // 2. Transcribe Audio (Whisper)
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("AI endpoints are not configured (Missing OPENAI_API_KEY).");
        }

        // Convert base64 to Blob
        const base64Data = args.audioBase64.split(",")[1] || args.audioBase64;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: args.mimeType });
        // Whisper needs a file extension, .webm is usually what MediaRecorder gives for audio/webm
        let ext = "webm";
        if (args.mimeType.includes("mp4")) ext = "mp4";
        if (args.mimeType.includes("mpeg")) ext = "mp3";
        if (args.mimeType.includes("wav")) ext = "wav";

        const file = new File([blob], `audio.${ext}`, { type: args.mimeType });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", "whisper-1");

        const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`
            },
            body: formData,
        });

        if (!whisperResponse.ok) {
            const errorText = await whisperResponse.text();
            console.error("Whisper Error:", errorText);
            try {
                const parsed = JSON.parse(errorText);
                throw new Error(`OpenAI Error: ${parsed.error?.message || errorText}`);
            } catch {
                throw new Error(`Failed to process audio transcription: ${errorText}`);
            }
        }

        const whisperData = await whisperResponse.json();
        const transcript = whisperData.text;

        if (!transcript || transcript.trim().length === 0) {
            throw new Error("Could not hear any speech. Please try again.");
        }

        // 3. Extract Expenses (gpt-4o-mini)
        const categories = await ctx.runQuery(api.expenses.getCategories);
        const validCategoryIds = categories.map((c: { id: string }) => c.id).join(", ");

        const now = new Date();

        const systemPrompt = `You are a helpful financial assistant. Extract expenses from the user's input.
The user might mention one or multiple expenses.
Return the result as a JSON array of objects.
Each object must have:
- "amount": a number
- "description": a brief string describing the expense
- "category": one of the following exact string values: [${validCategoryIds}]. If unsure, use "other".
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

        return parsedExpenses;
    }
});
