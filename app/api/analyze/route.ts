import { createModelInstance } from '@/lib/ai-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        const paymentHash = req.headers.get("X-Payment-Hash");

        // Log payment proof
        if (paymentHash) console.log("x402 Payment Proof:", paymentHash);

        if (!process.env.VERCEL_GATEWAY_API_KEY) {
            // Mock response if no key
            return new Response(JSON.stringify({
                layers: [
                    { name: "Background", description: "A dark cyberpunk cityscape with neon lights", rarity: 100 },
                    { name: "Body", description: "A metallic robot body with exposed gears", rarity: 100 },
                    { name: "Head", description: "A futuristic helmet with glowing visor", rarity: 100 }
                ]
            }), { status: 200 });
        }

        // Use unified provider
        const model = createModelInstance('gpt-4o');

        const { object } = await generateObject({
            model: model,
            schema: z.object({
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
                        description: z.string().describe('Visual prompt for avoiding ambiguity'),
                        rarity: z.number().describe('Rarity % (Traits in this layer MUST sum to 100)')
                    })).min(1)
                })),
            }),
            system: 'You are an expert NFT collection architect. Break down the user concept into composition layers with a clear hierarchical structure. IMPORTANT: Create parent-child relationships where appropriate. For example, "Background" is typically the root layer (parentLayer: ""), then "Body" is a child of "Background" (parentLayer: "Background"), and "Head", "Arms", "Legs" are children of "Body" (parentLayer: "Body"). Most layers should have a parent - only the first foundational layer (usually Background) should have an empty parentLayer. Each layer has specific traits. Ensure traits for a layer sum to exactly 100% rarity. Assign logical X/Y positions for flowchart references where parent layers are positioned to the left of their children.',
            prompt: `Analyze this concept and create a hierarchical layer structure with parent-child relationships: "${prompt}"`,
        });

        console.log("Analysis Output:", JSON.stringify(object, null, 2));
        return new Response(JSON.stringify(object), { status: 200 });
    } catch (error) {
        console.error("Analysis failed:", error);
        return new Response(JSON.stringify({ error: "Failed to analyze prompt" }), { status: 500 });
    }
}
