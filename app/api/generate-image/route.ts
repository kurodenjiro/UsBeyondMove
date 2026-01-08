import { openai } from '@ai-sdk/openai';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { prompt, style } = await req.json();
        const paymentHash = req.headers.get("X-Payment-Hash");

        if (paymentHash) console.log("x402 Image Gen Proof:", paymentHash);

        if (!process.env.VERCEL_GATEWAY_API_KEY) {
            // Mock image
            return new Response(JSON.stringify({
                url: "https://via.placeholder.com/1024x1024.png?text=Mock+AI+Image"
            }), { status: 200 });
        }

        // Use OpenAI API directly for image generation
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.VERCEL_GATEWAY_API_KEY}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: `${prompt}. Isolated asset on transparent background, high quality 2D game asset, clean edges.`,
                n: 1,
                size: "1024x1024"
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
        }

        // OpenAI returns `data` array with url
        const imageUrl = data.data?.[0]?.url;
        if (!imageUrl) throw new Error("No image URL returned from OpenAI");

        return new Response(JSON.stringify({ url: imageUrl }), { status: 200 });

    } catch (error: any) {
        console.error("Image Generation failed:", error);
        return new Response(JSON.stringify({ error: "Failed to generate image" }), { status: 500 });
    }
}
