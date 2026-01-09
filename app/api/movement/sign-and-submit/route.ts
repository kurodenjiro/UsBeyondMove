import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import {
    Aptos,
    AptosConfig,
    Network,
    AccountAuthenticatorEd25519,
    Ed25519PublicKey,
    Ed25519Signature,
    generateSigningMessageForTransaction,
} from '@aptos-labs/ts-sdk';

const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!
);

const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://testnet.movementnetwork.xyz/v1"
});
const aptos = new Aptos(config);

// Helper to convert Uint8Array to hex
const toHex = (arr: Uint8Array): string => {
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify the user's access token
        const verifiedClaims = await privy.verifyAuthToken(token);
        const userId = verifiedClaims.userId;

        console.log('[Server] Verified user:', userId);

        const { function: func, typeArguments = [], functionArguments = [] } = await req.json();

        if (!func) {
            return NextResponse.json({ error: 'Missing function' }, { status: 400 });
        }

        // Get user's Aptos wallet
        const user = await privy.getUser(userId);

        console.log('[Server] User object keys:', Object.keys(user));
        console.log('[Server] linkedAccounts exists:', !!user.linkedAccounts);

        // Try different property names
        const linkedAccounts = (user as any).linkedAccounts || (user as any).linked_accounts || [];

        console.log('[Server] Linked accounts count:', linkedAccounts.length);
        if (linkedAccounts.length > 0) {
            console.log('[Server] First account:', linkedAccounts[0]);
        }

        const aptosWallet = linkedAccounts.find(
            (account: any) => {
                const isWallet = account.type === 'wallet';
                const isAptos = account.chainType === 'aptos' || account.chain_type === 'aptos';
                console.log('[Server] Checking account:', { type: account.type, chainType: account.chainType || account.chain_type, isWallet, isAptos });
                return isWallet && isAptos;
            }
        );

        if (!aptosWallet) {
            return NextResponse.json({
                error: 'No Aptos wallet found for user',
                debug: {
                    linkedAccountsCount: linkedAccounts.length,
                    accountTypes: linkedAccounts.map((a: any) => ({ type: a.type, chain: a.chainType || a.chain_type }))
                }
            }, { status: 400 });
        }

        const walletAddress = aptosWallet.address;
        console.log('[Server] Found Aptos wallet:', walletAddress);

        // Build the transaction
        const rawTxn = await aptos.transaction.build.simple({
            sender: walletAddress,
            data: {
                function: func,
                typeArguments,
                functionArguments,
            },
        });

        console.log('[Server] Transaction built');

        // For now, return an error explaining server-side signing limitations
        return NextResponse.json({
            error: 'Server-side signing for Aptos requires Privy enterprise plan or custom implementation. Your Aptos address: ' + walletAddress + '. Please use Petra Wallet to import and sign transactions.',
            aptosAddress: walletAddress,
        }, { status: 501 });

    } catch (error: any) {
        console.error('[Server] Error:', error);
        console.error('[Server] Error stack:', error.stack);
        return NextResponse.json({
            error: error?.message || 'Failed to process request',
            details: error.stack,
        }, { status: 500 });
    }
}
