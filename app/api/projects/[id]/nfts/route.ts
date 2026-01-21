
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to transform NFT for response
const transformNft = (nft: any) => ({
    ...nft,
    image: `/api/nfts/${nft.id}/image`
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = id;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const where: any = { projectId: projectId };
        if (status) {
            where.mintStatus = status;
        }

        const nfts = await prisma.nft.findMany({
            where: where,
            orderBy: { name: 'asc' } // Simple ordering, or custom numeric sort
        });


        // Transform image data to URL
        const transformedNfts = nfts.map(transformNft);

        return NextResponse.json({ nfts: transformedNfts });


    } catch (error: any) {
        console.error("Error fetching NFTs:", error);
        return NextResponse.json({ error: "Failed to fetch NFTs" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = id;
        const { image: providedImage, attributes } = await req.json();

        let finalImage = providedImage;

        // If image not provided, generate it from attributes
        if (!finalImage && attributes && Array.isArray(attributes)) {
            console.log("🎨 Generating NFT image server-side from attributes...");

            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) throw new Error("Project not found");

            const layers = project.layers as any[];

            // 1. Get Base Image (Body)
            const bodyLayer = layers.find(l => l.name === "Body");
            // If explicit body trait in attributes? usually not. Fallback to first body trait.
            // Or check if attributes has 'Body'?
            const bodyAttr = attributes.find((a: any) => a.trait_type === "Body");
            const bodyTrait = bodyAttr
                ? bodyLayer?.traits.find((t: any) => t.name === bodyAttr.value)
                : bodyLayer?.traits[0];

            if (!bodyTrait) throw new Error("Base character (Body) not found");

            // Helper
            const getBase64 = (url: string) => url.replace(/^data:image\/\w+;base64,/, "");
            const baseImageData = getBase64(bodyTrait.imageUrl);

            // 2. Get Other Traits
            const traitsToComposite = attributes
                .filter((a: any) => a.trait_type !== "Body")
                .map((a: any) => {
                    const layer = layers.find(l => l.name === a.trait_type);
                    const trait = layer?.traits.find((t: any) => t.name === a.value);
                    if (!trait) return null;
                    return {
                        category: a.trait_type.toLowerCase(),
                        imageData: getBase64(trait.imageUrl)
                    };
                })
                .filter((t: any): t is { category: string; imageData: string } => t !== null);

            // 3. Composite
            const { compositeTraits } = await import('@/lib/ai/composite');
            const compositedBase64 = await compositeTraits(baseImageData, traitsToComposite);
            finalImage = `data:image/png;base64,${compositedBase64}`;
        }

        if (!finalImage) {
            return NextResponse.json({ error: "Could not generate image: missing image or valid attributes" }, { status: 400 });
        }

        // Generate a name based on existing count
        const count = await prisma.nft.count({
            where: { projectId }
        });

        const nft = await prisma.nft.create({
            data: {
                projectId,
                name: `NFT #${count + 1}`,
                image: finalImage,
                attributes,
                mintStatus: 'pending'
            }
        });

        return NextResponse.json(transformNft(nft));
    } catch (error: any) {
        console.error("Error creating NFT:", error);
        return NextResponse.json({ error: error.message || "Failed to create NFT" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = id;
        // project id is 'id', but we need nftId from body
        const { nftId, image: providedImage, attributes } = await req.json();

        if (!nftId) {
            return NextResponse.json({ error: "Missing nftId" }, { status: 400 });
        }

        let finalImage = providedImage;

        // If image not provided, generate it from attributes
        if (!finalImage && attributes && Array.isArray(attributes)) {
            console.log("🎨 Regenerating NFT image server-side...");
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) throw new Error("Project not found");

            const layers = project.layers as any[];

            // 1. Get Base Image (Body)
            const bodyLayer = layers.find(l => l.name === "Body");
            const bodyAttr = attributes.find((a: any) => a.trait_type === "Body");
            const bodyTrait = bodyAttr
                ? bodyLayer?.traits.find((t: any) => t.name === bodyAttr.value)
                : bodyLayer?.traits[0];

            if (!bodyTrait) throw new Error("Base character (Body) not found");

            const getBase64 = (url: string) => url.replace(/^data:image\/\w+;base64,/, "");
            const baseImageData = getBase64(bodyTrait.imageUrl);

            // 2. Get Other Traits
            const traitsToComposite = attributes
                .filter((a: any) => a.trait_type !== "Body")
                .map((a: any) => {
                    const layer = layers.find(l => l.name === a.trait_type);
                    const trait = layer?.traits.find((t: any) => t.name === a.value);
                    if (!trait) return null;
                    return {
                        category: a.trait_type.toLowerCase(),
                        imageData: getBase64(trait.imageUrl)
                    };
                })
                .filter((t: any): t is { category: string; imageData: string } => t !== null);

            // 3. Composite
            const { compositeTraits } = await import('@/lib/ai/composite');
            const compositedBase64 = await compositeTraits(baseImageData, traitsToComposite);
            finalImage = `data:image/png;base64,${compositedBase64}`;
        }

        if (!finalImage) {
            return NextResponse.json({ error: "Missing image or valid attributes for regeneration" }, { status: 400 });
        }

        const updateData: any = { image: finalImage };
        if (attributes) updateData.attributes = attributes;

        const nft = await prisma.nft.update({
            where: { id: nftId },
            data: updateData
        });

        return NextResponse.json(transformNft(nft));
    } catch (error: any) {
        console.error("Error updating NFT:", error);
        return NextResponse.json({ error: error.message || "Failed to update NFT" }, { status: 500 });
    }
}
