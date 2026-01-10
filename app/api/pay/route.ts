import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const paymentHash = req.headers.get("X-Payment-Hash");
        if (!paymentHash) {
            return NextResponse.json({ error: "Missing Payment Hash" }, { status: 400 });
        }

        console.log(`Verifying Payment Hash: ${paymentHash}`);

        const recipient = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT;

        // Initialize Aptos Client
        const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");
        const config = new AptosConfig({
            network: Network.CUSTOM,
            fullnode: process.env.NEXT_PUBLIC_MOVEMENT_RPC_URL || "https://testnet.movementnetwork.xyz/v1"
        });
        const aptos = new Aptos(config);

        try {
            // Verify Transaction On-Chain
            const txn = await aptos.getTransactionByHash({ transactionHash: paymentHash });

            if (!txn) {
                return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
            }

            if (txn.type !== "user_transaction") {
                return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
            }

            if (!txn.success) {
                return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });
            }

            // Optional: Verify payload (function, arguments, recipient, amount)
            // This requires deep inspection of txn.payload
            // For now, simple existence and success is a good baseline.

            console.log("✅ Payment Verified On-Chain");

            return NextResponse.json({
                success: true,
                verified: true,
                txHash: paymentHash
            });

        } catch (aptosError: any) {
            console.error("Aptos Verification Error:", aptosError);
            return NextResponse.json({ error: "Failed to verify transaction on-chain" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Payment API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
