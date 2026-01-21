import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("No API key found");
}

const ai = new GoogleGenAI({ apiKey });

interface NFTConfig {
    subject: string;
    theme: string;
    artStyle: string;
    mood: string;
    faceOrientation: string;
    colorPalette: string[];
}

interface GeneratedTrait {
    category: string;
    description: string;
    imageData: string; // base64
}

// Generate trait
async function generateTrait(category: string, config: NFTConfig, variationNumber: number): Promise<GeneratedTrait | null> {
    const prompt = `Generate a single ${category} trait for an NFT character.

STYLE TO MATCH:
- Art Style: ${config.artStyle}
- Theme: ${config.theme}
- Mood: ${config.mood}
- Color Palette: ${config.colorPalette.join(", ")}

REQUIREMENTS:
1. Create ONLY the ${category} item (not the full character)
2. Match the art style exactly
3. Use the specified color palette
4. Transparent or solid background
5. Professional NFT quality
6. Variation ${variationNumber} - make it unique

EXAMPLES:
- background: gradient, pattern, scene, abstract, solid color
- headwear: hat, cap, crown, helmet, headband
- eyewear: sunglasses, glasses, goggles, visor
- accessory: chain, earring, watch, badge
- clothing: shirt, jacket, vest, hoodie

OUTPUT: Just the ${category} item, ready to be composited onto a character.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: {
                role: "user",
                parts: [{ text: prompt }]
            },
            config: {
                seed: (Date.now() + variationNumber) % 2147483647,
                temperature: 0.7
            }
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
        if (!imagePart || !imagePart.inlineData?.data) return null;

        return {
            category,
            description: `${category} variation ${variationNumber}`,
            imageData: imagePart.inlineData.data
        };
    } catch (error) {
        console.error(`Failed to generate ${category} ${variationNumber}`, error);
        return null; // Return null on failure so we don't break the client loop hard, or could throw.
    }
}

export async function POST(request: NextRequest) {
    try {
        const { projectId, config, category, variationNumber } = await request.json();

        if (!projectId || !config || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`Generating trait: ${category} #${variationNumber} for project ${projectId}`);
        const trait = await generateTrait(category, config, variationNumber);

        if (!trait) {
            return NextResponse.json({ error: 'Failed to generate trait image' }, { status: 500 });
        }

        // Update Project Layers
        // We need to fetch current layers, find or create the layer for this category, and append the trait.
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new Error("Project not found");

        let layers = project.layers as any[];
        if (!Array.isArray(layers)) layers = [];

        const displayName = category.charAt(0).toUpperCase() + category.slice(1);
        let layerIndex = layers.findIndex((l: any) => l.name === displayName);

        const newTrait = {
            name: trait.description,
            rarity: 10, // Default rarity, will update logic later if needed
            imageUrl: `data:image/png;base64,${trait.imageData}`,
            description: trait.description,
            anchorPoints: { top: false, bottom: false, left: false, right: false }
        };

        if (layerIndex >= 0) {
            // Add to existing layer
            layers[layerIndex].traits.push(newTrait);
            // Recalculate rarities
            const traitCount = layers[layerIndex].traits.length;
            layers[layerIndex].traits.forEach((t: any) => t.rarity = 100 / traitCount);
        } else {
            // Create new layer
            const newLayer = {
                name: displayName,
                parentLayer: category === 'background' ? '' : 'Body', // Simplified parenting logic
                position: { x: 0, y: 0, width: 1024, height: 1024 },
                aiPrompt: `${category} for ${config.subject}`,
                traits: [
                    { ...newTrait, rarity: 100 }
                ]
            };
            layers.push(newLayer);
        }

        await prisma.project.update({
            where: { id: projectId },
            data: { layers }
        });

        return NextResponse.json({
            success: true,
            trait
        });

    } catch (error: any) {
        console.error('Trait generation error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate trait' }, { status: 500 });
    }
}
