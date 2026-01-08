import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

// Movement Move Testnet Configuration
const MOVEMENT_CONFIG = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: process.env.NEXT_PUBLIC_MOVEMENT_RPC_URL || "https://testnet.movementnetwork.xyz/v1",
});

const aptos = new Aptos(MOVEMENT_CONFIG);

export async function sendServerPayment(recipient: string, amountMove: number) {
    const privateKeyHex = process.env.MOVEMENT_PRIVATE_KEY;

    if (!privateKeyHex) {
        throw new Error("MOVEMENT_PRIVATE_KEY is not set");
    }

    // Initialize Server Account
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const serverAccount = Account.fromPrivateKey({ privateKey });

    console.log(`💸 Server (Move) sending ${amountMove} MOVE to ${recipient}...`);

    // Amount in Octas (1 MOVE = 100,000,000 Octas)
    const amountOctas = Math.floor(amountMove * 100_000_000);

    try {
        const transaction = await aptos.transaction.build.simple({
            sender: serverAccount.accountAddress,
            data: {
                function: "0x1::aptos_account::transfer",
                functionArguments: [recipient, amountOctas],
            },
        });

        const pendingTx = await aptos.signAndSubmitTransaction({
            signer: serverAccount,
            transaction,
        });

        console.log(`⏳ Payment submitted: ${pendingTx.hash}`);

        const executedTx = await aptos.waitForTransaction({
            transactionHash: pendingTx.hash,
        });

        if (!executedTx.success) {
            throw new Error(`Transaction failed on-chain: ${pendingTx.hash}`);
        }

        console.log(`✅ Payment confirmed: ${executedTx.hash}`);
        return executedTx.hash;

    } catch (error: any) {
        console.error("Server payment (Move) failed:", error);

        if (error.message && error.message.includes("Account not found")) {
            console.error(`❌ CRITICAL: Server Wallet ${serverAccount.accountAddress.toString()} is not active on-chain.`);
            console.error("👉 Please fund this wallet using the Movement Faucet to initialize it.");
            // Throw clearer error for API response
            throw new Error(`Server Wallet not active. Please fund: ${serverAccount.accountAddress.toString()}`);
        }

        throw error;
    }
}
