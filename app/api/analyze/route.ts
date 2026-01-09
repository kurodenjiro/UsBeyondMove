import { createModelInstance } from '@/lib/ai-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { prompt, aspectRatio = "1:1", upscale = "Original" } = await req.json();
        const paymentHash = req.headers.get("X-Payment-Hash");

        // Log payment proof
        if (paymentHash) console.log("x402 Payment Proof:", paymentHash);

        if (!process.env.VERCEL_GATEWAY_API_KEY) {
            // Mock response if no key
            return new Response(JSON.stringify({
                aspectRatio,
                upscale,
                layers: [
                    { name: "Background", description: "A dark cyberpunk cityscape with neon lights", rarity: 100, parentLayer: "", position: { x: 100, y: 100 }, traits: [] },
                    { name: "Body", description: "A metallic robot body with exposed gears", rarity: 100, parentLayer: "Background", position: { x: 300, y: 100 }, traits: [] },
                    { name: "Head", description: "A futuristic helmet with glowing visor", rarity: 100, parentLayer: "Body", position: { x: 500, y: 100 }, traits: [] }
                ]
            }), { status: 200 });
        }

        // Use unified provider
        const model = createModelInstance('gpt-4o');

        const { object } = await generateObject({
            model: model,
            schema: z.object({
                aspectRatio: z.string().describe('Image aspect ratio setting'),
                upscale: z.string().describe('Upscale setting'),
                layers: z.array(z.object({
                    name: z.string().describe('Name of the layer (e.g. Background, Body, Hat)'),
                    description: z.string().describe('General description for this layer category'),
                    parentLayer: z.string().describe('Name of the parent layer if this is a sub-layer (e.g. "Body" is parent of "Head", "Legs"). Use empty string "" for root layers.'),
                    rarity: z.number().describe('Overall layer rarity % (how often this layer appears in the collection, default 100)'),
                    position: z.object({
                        x: z.number().describe('Horizontal position on the composition (0-1000)'),
                        y: z.number().describe('Vertical position on the composition (0-1000)')
                    }),
                    traits: z.array(z.object({
                        name: z.string().describe('Specific trait name (e.g. Red Hair, Blue Hair)'),
                        description: z.string().describe('Brief visual description'),
                        aiPrompt: z.string().describe('Detailed AI generation prompt with exact canvas positioning and 2D game asset specifications'),
                        rarity: z.number().describe('Rarity % (Traits in this layer MUST sum to 100)')
                    })).min(1)
                })),
            }),
            system: `You are an expert NFT collection architect specializing in 2D game assets.

CRITICAL HIERARCHY RULE:
- ONLY the first/root layer (typically "Background") should have parentLayer: ""
- ALL other layers MUST have a parent specified
- Example: Background (parentLayer:""), Body (parentLayer:"Background"), Head (parentLayer:"Body")

AI PROMPT FORMAT (VERY IMPORTANT):
For each trait, generate a detailed "aiPrompt" following this exact format:
"A minimalist 2D flat vector game asset of [trait name] for the [layer name] layer. The [asset description] is positioned at x=[x coordinate], y=[y coordinate] on a 1024x1024 white canvas. Design features [specific visual details], perfectly symmetrical, clean edges, isolated on a solid white background. No shadows, no gradients, 2D game UI style."

Example:
"A minimalist 2D flat vector game asset of panda eye patches for the Eyes layer. The pair of eyes is positioned at x=512, y=400 on a 1024x1024 white canvas. Design features two high-contrast black ovals with white pupils, perfectly symmetrical, clean edges, isolated on a solid white background. No shadows, no gradients, 2D game UI style."

REQUIREMENTS:
- Traits must sum to 100% rarity per layer
- Use exact x,y coordinates from the layer's position
- Always specify "1024x1024 white canvas"
- Always include "2D flat vector game asset"
- Always include "No shadows, no gradients, 2D game UI style"
- Return aspectRatio: "${aspectRatio}" and upscale: "${upscale}"`,
            prompt: `Analyze: "${prompt}"`,
        });

        console.log("Analysis Output:", JSON.stringify(object, null, 2));
        return new Response(JSON.stringify(object), { status: 200 });
    } catch (error) {
        console.error("Analysis failed:", error);
        return new Response(JSON.stringify({ error: "Failed to analyze prompt" }), { status: 500 });
    }
}
