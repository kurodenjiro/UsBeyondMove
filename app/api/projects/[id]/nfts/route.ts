
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        return NextResponse.json({ nfts });

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
        const { image, attributes } = await req.json();

        // Generate a name based on existing count
        const count = await prisma.nft.count({
            where: { projectId }
        });

        const nft = await prisma.nft.create({
            data: {
                projectId,
                name: `NFT #${count + 1}`,
                image,
                attributes,
                mintStatus: 'pending'
            }
        });

        return NextResponse.json(nft);
    } catch (error: any) {
        console.error("Error creating NFT:", error);
        return NextResponse.json({ error: "Failed to create NFT" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // project id is 'id', but we need nftId from body
        const { nftId, image } = await req.json();

        if (!nftId || !image) {
            return NextResponse.json({ error: "Missing nftId or image" }, { status: 400 });
        }

        const nft = await prisma.nft.update({
            where: { id: nftId },
            data: { image }
        });

        return NextResponse.json(nft);
    } catch (error: any) {
        console.error("Error updating NFT:", error);
        return NextResponse.json({ error: "Failed to update NFT" }, { status: 500 });
    }
}
