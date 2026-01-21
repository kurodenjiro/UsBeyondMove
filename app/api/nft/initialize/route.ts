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

// Parse prompt to config using AI
async function parsePromptToConfig(prompt: string): Promise<NFTConfig> {
    const aiPrompt = `Analyze this NFT collection prompt and extract configuration details.

Prompt: "${prompt}"

Provide a JSON response with:
{
    "subject": "main character type (e.g., cat, robot, dragon, alien)",
    "theme": "theme/style (e.g., cyberpunk, fantasy, horror, cute)",
    "artStyle": "art style (e.g., cartoon, anime, realistic, pixel art)",
    "mood": "mood/expression (e.g., cool, fierce, cute, mysterious)",
    "faceOrientation": "face view (frontal, three-quarter, or profile)",
    "colorPalette": ["#hex1", "#hex2", "#hex3"]
}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: {
                role: "user",
                parts: [{ text: aiPrompt }]
            }
        });

        const analysisText = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        const config = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (!config) throw new Error("Failed to parse prompt");

        // Ensure all fields have valid defaults
        config.subject = config.subject || "character";
        config.theme = config.theme || "modern";
        config.artStyle = config.artStyle || "cartoon";
        config.mood = config.mood || "cool";
        config.faceOrientation = config.faceOrientation || "three-quarter";

        if (!config.colorPalette || !Array.isArray(config.colorPalette) || config.colorPalette.length === 0) {
            config.colorPalette = ["#00FF00", "#FF00FF", "#FFFF00"];
        }

        return config;
    } catch (error) {
        // Fallback
        console.warn("Prompt parsing failed, using fallback config", error);
        const words = prompt.toLowerCase().split(" ");
        return {
            subject: words[words.length - 1] || "character",
            theme: words[0] || "modern",
            artStyle: "cartoon",
            mood: "cool",
            faceOrientation: "three-quarter",
            colorPalette: ["#00FF00", "#FF00FF", "#FFFF00"]
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { prompt, ownerAddress } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // 1. Parse prompt to config
        const config = await parsePromptToConfig(prompt);

        // 2. Create Project Stub
        // We store the config in the layers field for now or just initialize basic layers structure
        // Actually, we can return the config to the client and let the client pass it back or store it in the project description/name for reference
        // Better yet, let's just create the project. We'll store the config as a temporarily hidden layer or just use the prompt.
        // For this refactor, let's store the config in the Project. We might need to add a field or just use 'layers' to store metadata initially.
        // Let's assume we proceed with creating the project and returning the ID.

        const project = await prisma.project.create({
            data: {
                ownerAddress: ownerAddress || "anonymous",
                prompt,
                name: `${config.subject} ${config.theme} Collection`,
                layers: [], // Initialize empty
                status: "initializing",
                // We can't easily store arbitrary JSON config in existing schema without a new field
                // BUT, we can just return the config to the client, and the client will use it for subsequent calls?
                // OR better: we don't strictly need to store it if we can regenerate or if the subsequent steps just need projectId.
                // Wait, generate-base needs config. 
                // Let's store the parsed config in "layers" temporarily? No that breaks type safety if layers is strict.
                // It's defined as Json. Let's look at schema again. `layers Json`.
                // Okay, we can store it there for now or add a `metadata` field. 
                // Let's stick to the plan: Return config to client, Client passes config to `generate-base`.
                // Actually, passing config back and forth is okay. 
                // Alternative: Save config in a "hidden" layer named "__config__".
            }
        });

        return NextResponse.json({
            projectId: project.id,
            config
        });

    } catch (error: any) {
        console.error('Project initialization error:', error);
        return NextResponse.json({ error: error.message || 'Failed to initialize project' }, { status: 500 });
    }
}
