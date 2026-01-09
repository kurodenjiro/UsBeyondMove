import { NextResponse } from 'next/server';
import {
    Aptos,
    AptosConfig,
    Network,
    AccountAddress,
    generateSigningMessageForTransaction
} from '@aptos-labs/ts-sdk';
import { toHex } from 'viem';

const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://testnet.movementnetwork.xyz/v1"
});
const aptos = new Aptos(config);

export async function POST(req: Request) {
    try {
        const { sender, function: func, typeArguments = [], functionArguments = [] } = await req.json();

        if (!sender || !func) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Pad EVM address to Aptos format (64 hex chars)
        let paddedAddress = sender.toLowerCase().replace('0x', '');
        if (paddedAddress.length < 64) {
            paddedAddress = paddedAddress.padStart(64, '0');
        }
        paddedAddress = '0x' + paddedAddress;

        // Convert sender address
        const senderAddress = AccountAddress.from(paddedAddress);

        // Build the transaction
        const rawTxn = await aptos.transaction.build.simple({
            sender: senderAddress,
            data: {
                function: func,
                typeArguments,
                functionArguments,
            },
        });

        // Generate hash for Privy signing
        const message = generateSigningMessageForTransaction(rawTxn);
        const hash = toHex(message);

        const rawTxnHex = rawTxn.bcsToHex().toString();

        return NextResponse.json({
            hash,
            rawTxnHex,
        });
    } catch (error: any) {
        console.error('Error generating transaction hash:', error);
        return NextResponse.json({
            error: error?.message || 'Failed to generate transaction hash'
        }, { status: 500 });
    }
}
