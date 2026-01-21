import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const nft = await prisma.nft.findUnique({
            where: { id: id },
            select: { image: true }
        });

        if (!nft || !nft.image) {
            return new NextResponse("Image not found", { status: 404 });
        }

        // nft.image is stored as "data:image/png;base64,..."
        // We need to strip the prefix and serve as binary
        const matches = nft.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
            // Fallback if not valid base64 URI, maybe it's a raw URL?
            if (nft.image.startsWith('http')) {
                return NextResponse.redirect(nft.image);
            }
            return new NextResponse("Invalid image data", { status: 500 });
        }

        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': type,
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });

    } catch (error) {
        console.error("Error serving NFT image:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
