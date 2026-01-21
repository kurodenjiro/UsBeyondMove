import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compositeTraits } from '@/lib/ai/composite';

export const maxDuration = 300; // 5 minutes max for compositing (usually fast)

export async function POST(request: NextRequest) {
    try {
        const { projectId, variantIndex } = await request.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Fetch Project to get layers
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || !project.layers) {
            throw new Error("Project or layers not found");
        }

        const layers = project.layers as any[];

        // 1. Identify Base and Categories
        const bodyLayer = layers.find(l => l.name === "Body");
        const baseTrait = bodyLayer?.traits[0];

        if (!baseTrait) {
            throw new Error("Base character trait not found in Body layer");
        }

        // Helper to strip base64 prefix
        const getBase64 = (url: string) => url.replace(/^data:image\/\w+;base64,/, "");

        const baseImageData = getBase64(baseTrait.imageUrl);

        // 2. Select Traits Randomly
        // We skip Body and Background for random selection logic if we handle them separately or as fixed base
        // Actually background is a valid random trait. Body is usually fixed in this specific flow (single base, multiple accessories).

        const categories = layers.filter(l => l.name !== "Body").map(l => l.name);

        const selectedTraitsRaw = categories.map(catName => {
            const layer = layers.find(l => l.name === catName);
            if (!layer || !layer.traits || layer.traits.length === 0) return null;

            // Random selection
            const randomTrait = layer.traits[Math.floor(Math.random() * layer.traits.length)];
            return {
                category: catName.toLowerCase(),
                name: randomTrait.name,
                imageUrl: randomTrait.imageUrl
            };
        }).filter(t => t !== null);

        // 3. Composite
        const traitsToComposite = selectedTraitsRaw.map(t => ({
            category: t!.category,
            imageData: getBase64(t!.imageUrl)
        }));

        const compositedImage = await compositeTraits(baseImageData, traitsToComposite);
        const finalText = `data:image/png;base64,${compositedImage}`;

        // 4. Save NFT
        const nft = await prisma.nft.create({
            data: {
                projectId,
                name: `${project.name} #${variantIndex}`,
                image: finalText,
                attributes: selectedTraitsRaw.map(t => ({
                    trait_type: t!.category,
                    value: t!.name
                })),
                description: `${project.name} variant #${variantIndex}`
            }
        });

        return NextResponse.json({
            success: true,
            nft
        });

    } catch (error: any) {
        console.error('Variant generation error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate variant' }, { status: 500 });
    }
}
