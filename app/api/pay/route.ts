import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Processing Server-Side Sponsored Payment...");

        const recipient = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT;
        if (!recipient) {
            return NextResponse.json({ error: "Recipient not configured" }, { status: 500 });
        }

        // Use the Server Wallet logic to execute the payment
        // This ensures robustness without relying on user's embedded wallet state.
        const { sendServerPayment } = require("@/lib/server-wallet");

        // We pay 0.01 MOVE
        try {
            const txHash = await sendServerPayment(recipient, 0.01);
            return NextResponse.json({
                success: true,
                txHash: txHash,
            });
        } catch (serverPayError: any) {
            console.error("Sponsored Payment Logic Error:", serverPayError);

            // Propagate "Server Wallet not active" error distinctly so user knows to fund IT
            if (serverPayError.message && (
                serverPayError.message.includes("Server Wallet not active") ||
                serverPayError.message.includes("Account not found")
            )) {
                return NextResponse.json({
                    error: "Server Wallet Unfunded. Check server logs.",
                    details: serverPayError.message
                }, { status: 500 });
            }

            throw serverPayError;
        }

    } catch (error: any) {
        console.error("Payment API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
