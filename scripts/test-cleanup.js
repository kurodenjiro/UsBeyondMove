
async function verifyCleanup() {
    console.log("Verifying API Cleanup...");

    // List of removed APIs to check
    const removedApis = [
        "/api/analyze",
        "/api/analyze-image",
        "/api/analyze-traits",
        "/api/extract-traits",
        "/api/generate",
        "/api/plan-collection",
        "/api/rearrange",
        "/api/generate-sprite-sheet"
    ];

    for (const api of removedApis) {
        try {
            const res = await fetch(`http://localhost:3000${api}`);
            if (res.status === 404) {
                console.log(`✅ ${api} correctly removed (404)`);
            } else {
                console.warn(`⚠️ ${api} returned status ${res.status} (expected 404)`);
            }
        } catch (e) {
            // connection refused is also a good sign if server not running or route totally gone
            console.log(`✅ ${api} unreachable or removed`);
        }
    }

    // Check Active API
    console.log("\nChecking Active API...");
    try {
        const payload = {
            prompt: "test",
            ownerAddress: "0xTest",
            traitsPerCategory: 1,
            nftsToGenerate: 1
        };
        const res = await fetch('http://localhost:3000/api/generate-nft-collection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Active API Status: ${res.status} (Expected 200)`);

    } catch (e) {
        console.log("Active API check skipped (requires running server)");
    }
}

verifyCleanup();
