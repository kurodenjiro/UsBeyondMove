
import { NextRequest, NextResponse } from 'next/server';
import { compositeTraits } from '@/lib/ai/composite';

export async function POST(req: NextRequest) {
    try {
        const { baseImage, traits } = await req.json();

        if (!baseImage || !traits) {
            return NextResponse.json({ success: false, error: "Missing baseImage or traits" }, { status: 400 });
        }

        console.log("🎨 Compositing preview NFT...");

        // Strip base64 prefix if present
        const cleanBaseImage = baseImage.replace(/^data:image\/\w+;base64,/, "");
        const cleanTraits = traits.map((t: any) => ({
            ...t,
            imageData: t.imageData.replace(/^data:image\/\w+;base64,/, "")
        }));

        const compositeImage = await compositeTraits(cleanBaseImage, cleanTraits);

        return NextResponse.json({
            success: true,
            image: `data:image/png;base64,${compositeImage}`
        });

    } catch (error: any) {
        console.error("❌ Preview generation failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to generate preview"
        }, { status: 500 });
    }
}
