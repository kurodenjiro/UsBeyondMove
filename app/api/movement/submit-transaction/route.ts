import { NextResponse } from 'next/server';
import {
    Aptos,
    AptosConfig,
    Network,
    AccountAuthenticatorEd25519,
    Ed25519PublicKey,
    Ed25519Signature,
    SimpleTransaction,
    Hex,
    Deserializer
} from '@aptos-labs/ts-sdk';

const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://testnet.movementnetwork.xyz/v1"
});
const aptos = new Aptos(config);

export async function POST(req: Request) {
    try {
        const { rawTxnHex, publicKey, signature } = await req.json();

        if (!rawTxnHex || !publicKey || !signature) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Process the public key to ensure it's in the correct format
        let processedPublicKey = publicKey;

        // Remove 0x prefix if present
        if (processedPublicKey.toLowerCase().startsWith('0x')) {
            processedPublicKey = processedPublicKey.slice(2);
        }

        // Remove leading zeros if present (sometimes keys have 00 prefix)
        if (processedPublicKey.length === 66 && processedPublicKey.startsWith('00')) {
            processedPublicKey = processedPublicKey.substring(2);
        }

        // Ensure we have exactly 64 characters (32 bytes in hex)
        if (processedPublicKey.length !== 64) {
            throw new Error(`Invalid public key length: expected 64 characters, got ${processedPublicKey.length}`);
        }

        // Create authenticator
        const senderAuthenticator = new AccountAuthenticatorEd25519(
            new Ed25519PublicKey(processedPublicKey),
            new Ed25519Signature(signature)
        );

        // Deserialize the transaction
        const backendRawTxn = SimpleTransaction.deserialize(
            new Deserializer(Hex.fromHexInput(rawTxnHex).toUint8Array())
        );

        // Submit the transaction
        const pendingTxn = await aptos.transaction.submit.simple({
            transaction: backendRawTxn,
            senderAuthenticator: senderAuthenticator,
        });

        // Wait for confirmation
        const executedTxn = await aptos.waitForTransaction({
            transactionHash: pendingTxn.hash
        });

        return NextResponse.json({
            success: executedTxn.success,
            hash: executedTxn.hash,
            vmStatus: executedTxn.vm_status,
        });
    } catch (error: any) {
        console.error('Error submitting transaction:', error);
        return NextResponse.json({
            success: false,
            error: error?.message || 'Failed to submit transaction',
            vmStatus: error?.vm_status
        }, { status: 500 });
    }
}
