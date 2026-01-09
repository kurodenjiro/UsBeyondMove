import sharp from 'sharp';

export const maxDuration = 60;

interface BoundingBox {
    left: number;
    top: number;
    width: number;
    height: number;
}

export async function POST(req: Request) {
    try {
        const { imageData } = await req.json();

        console.log('✂️ Extracting traits from sprite sheet...');

        // Remove data URL prefix if present
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Load image with Sharp
        const image = sharp(buffer);
        const metadata = await image.metadata();
        const { width, height } = metadata;

        if (!width || !height) {
            throw new Error('Invalid image dimensions');
        }

        console.log(`📐 Image size: ${width}x${height}`);

        // Convert to raw pixel data for analysis
        const { data, info } = await image
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Define grey background color (RGB: 184, 184, 184 = #b8b8b8)
        // Use conservative threshold to preserve grey colors in characters
        const GREY_THRESHOLD = 20; // Conservative - only removes very close matches
        const GREY_R = 184;
        const GREY_G = 184;
        const GREY_B = 184;

        // Find all non-grey regions
        const visited = new Set<string>();
        const regions: BoundingBox[] = [];
        const MIN_REGION_SIZE = 5000; // Minimum pixels for a valid asset

        const isGrey = (r: number, g: number, b: number): boolean => {
            // Use sum of differences for more precise matching
            // Only removes pixels VERY close to exact background grey
            const diff = Math.abs(r - GREY_R) + Math.abs(g - GREY_G) + Math.abs(b - GREY_B);
            return diff < GREY_THRESHOLD;
        };

        const getPixel = (x: number, y: number): { r: number, g: number, b: number } => {
            const idx = (y * info.width + x) * info.channels;
            return {
                r: data[idx],
                g: data[idx + 1],
                b: data[idx + 2]
            };
        };

        // Flood fill to find connected regions
        const floodFill = (startX: number, startY: number): BoundingBox | null => {
            const queue: [number, number][] = [[startX, startY]];
            let minX = startX, maxX = startX;
            let minY = startY, maxY = startY;
            let pixelCount = 0;

            while (queue.length > 0) {
                const [x, y] = queue.shift()!;
                const key = `${x},${y}`;

                if (visited.has(key)) continue;
                if (x < 0 || x >= info.width || y < 0 || y >= info.height) continue;

                const pixel = getPixel(x, y);
                if (isGrey(pixel.r, pixel.g, pixel.b)) continue;

                visited.add(key);
                pixelCount++;

                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);

                // Add neighbors
                queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }

            // Filter out tiny regions (noise)
            if (pixelCount < MIN_REGION_SIZE) return null;

            return {
                left: minX,
                top: minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1
            };
        };

        // Scan for regions
        for (let y = 0; y < info.height; y += 5) {
            for (let x = 0; x < info.width; x += 5) {
                if (visited.has(`${x},${y}`)) continue;

                const pixel = getPixel(x, y);
                if (!isGrey(pixel.r, pixel.g, pixel.b)) {
                    const region = floodFill(x, y);
                    if (region) {
                        regions.push(region);
                    }
                }
            }
        }

        console.log(`🔍 Found ${regions.length} regions`);

        // Extract each region as a separate image
        const extractedTraits = await Promise.all(
            regions.map(async (region, index) => {
                // Add padding
                const padding = 10;
                const extractRegion = {
                    left: Math.max(0, region.left - padding),
                    top: Math.max(0, region.top - padding),
                    width: Math.min(info.width - region.left + padding, region.width + padding * 2),
                    height: Math.min(info.height - region.top + padding, region.height + padding * 2)
                };

                // Crop the region
                const croppedBuffer = await sharp(buffer)
                    .extract(extractRegion)
                    .toBuffer();

                // Manual background removal with conservative threshold
                // Preserves grey colors in characters while removing background
                const transparentBuffer = await sharp(croppedBuffer)
                    .removeAlpha()
                    .ensureAlpha()
                    .raw()
                    .toBuffer({ resolveWithObject: true });

                const { data: pixelData, info: cropInfo } = transparentBuffer;
                for (let i = 0; i < pixelData.length; i += 4) {
                    const r = pixelData[i];
                    const g = pixelData[i + 1];
                    const b = pixelData[i + 2];

                    // Only remove pixels VERY close to background grey
                    if (isGrey(r, g, b)) {
                        pixelData[i + 3] = 0;
                    }
                }

                // Convert back to PNG with transparency
                const finalBuffer = await sharp(pixelData, {
                    raw: {
                        width: cropInfo.width,
                        height: cropInfo.height,
                        channels: 4
                    }
                })
                    .png()
                    .toBuffer();

                const base64 = finalBuffer.toString('base64');
                const dataUrl = `data:image/png;base64,${base64}`;

                return {
                    index,
                    imageUrl: dataUrl,
                    boundingBox: region
                };
            })
        );

        console.log(`✅ Extracted ${extractedTraits.length} traits`);

        return new Response(JSON.stringify({
            traits: extractedTraits,
            totalFound: extractedTraits.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("❌ Trait extraction failed:", error);
        return new Response(JSON.stringify({
            error: error.message || "Failed to extract traits"
        }), { status: 500 });
    }
}
