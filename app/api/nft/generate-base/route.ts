import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { prisma } from '@/lib/prisma';

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

// Generate NFT sample
async function generateNFTSample(config: NFTConfig): Promise<string> {
    const prompt = `Create a CLEAN, MINIMAL NFT character base with NO accessories or traits.

SUBJECT & STYLE:
- Subject: ${config.subject}
- Theme: ${config.theme}
- Art Style: ${config.artStyle}
- Mood/Expression: ${config.mood}
- Face Orientation: ${config.faceOrientation} view
- Color Palette: ${config.colorPalette.join(", ")}

CRITICAL REQUIREMENTS - CLEAN BASE ONLY:
1. Create a ${config.subject} character in ${config.artStyle} style
2. ${config.mood} expression
3. ${config.faceOrientation} face orientation
4. NO accessories, clothing, jewelry, or items
5. Clean, simple, minimal design
6. Solid background color
7. Professional NFT quality
8. Centered composition, portrait orientation`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: {
                role: "user",
                parts: [{ text: prompt }]
            },
            config: {
                seed: Date.now() % 2147483647,
                temperature: 0.5
            }
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
        if (!imagePart || !imagePart.inlineData?.data) {
            throw new Error("Failed to generate NFT sample");
        }

        return imagePart.inlineData.data;
    } catch (error) {
        console.error("Gemini Image Generation Error:", error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { projectId, config } = await request.json();

        if (!projectId || !config) {
            return NextResponse.json({ error: 'Project ID and Config are required' }, { status: 400 });
        }

        // 1. Generate base NFT sample
        console.log(`Generating base for project ${projectId}...`);
        const baseImageData = await generateNFTSample(config);

        // 2. Prepare Base Layer Data
        const bodyLayer = {
            name: "Body",
            parentLayer: "Background",
            position: { x: 0, y: 0, width: 1024, height: 1024 },
            aiPrompt: `Base character ${config.subject}`,
            traits: [{
                name: "Base Character",
                rarity: 100,
                imageUrl: `data:image/png;base64,${baseImageData}`,
                description: "Original generated base",
                anchorPoints: { top: false, bottom: false, left: false, right: false }
            }]
        };

        const bgLayer = {
            name: "Background",
            parentLayer: "",
            position: { x: 0, y: 0, width: 1024, height: 1024 },
            aiPrompt: `Background for ${config.subject}`,
            traits: [] // Will be populated if we generate backgrounds specifically, or we can add a default "Empty" one if needed
        };

        // 3. Update Project
        // We need to fetch existing layers first to append? Or just overwrite 'Body' if it exists?
        // Since this is the "base" step, we can initialize the project with these core layers.

        await prisma.project.update({
            where: { id: projectId },
            data: {
                previewImage: `data:image/png;base64,${baseImageData}`,
                // We overwrite layers here because this is the foundational step
                layers: [bgLayer, bodyLayer]
            }
        });

        return NextResponse.json({
            success: true,
            baseImageData
        });

    } catch (error: any) {
        console.error('Base generation error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate base NFT' }, { status: 500 });
    }
}
