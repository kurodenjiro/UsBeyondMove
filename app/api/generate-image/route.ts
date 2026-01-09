import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { prompt, style } = await req.json();
        const paymentHash = req.headers.get("X-Payment-Hash");

        if (paymentHash) console.log("x402 Image Gen Proof:", paymentHash);

        // Check for Google AI API key
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("❌ No Google AI API key found. Set GOOGLE_AI_API_KEY in .env.local");
            return new Response(JSON.stringify({
                error: "No API key configured"
            }), { status: 500 });
        }

        console.log("✅ Generating image with Gemini 2.5 Flash...");

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: prompt,
        });

        // Extract image data from response (following official example)
        let imageData: string | null = null;

        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                console.log("Text response:", part.text);
            }
            if (part.inlineData) {
                imageData = part.inlineData.data;
                console.log("✅ Found image data in response");
            }
        }

        // Check if we got image data
        if (!imageData) {
            throw new Error("No image data returned from Gemini");
        }

        // Convert to base64 data URL
        const imageUrl = `data:image/png;base64,${imageData}`;

        console.log("✅ Image generated successfully with Gemini");
        return new Response(JSON.stringify({ url: imageUrl }), { status: 200 });

    } catch (error: any) {
        console.error("❌ Image Generation failed:", error);

        // Check if it's a quota error
        if (error.status === 429 || error.message?.includes("quota")) {
            return new Response(JSON.stringify({
                error: "Gemini API quota exceeded. Please wait or upgrade your plan."
            }), { status: 429 });
        }

        return new Response(JSON.stringify({
            error: error.message || "Failed to generate image"
        }), { status: 500 });
    }
}
