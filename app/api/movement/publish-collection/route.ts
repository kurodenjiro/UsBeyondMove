import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519PrivateKey,
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

const CONTRACT_ADDRESS = "0xb8d93aa049419e32be220fe5c456e25a4fd9287127626a9ea2b9c46cf6734222";

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

        console.log('[Publish Collection] Verified user:', userId);

        const { name, description, maxSupply } = await req.json();

        if (!name || !description || !maxSupply) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user's Aptos wallet
        const user = await privy.getUser(userId);
        const linkedAccounts = (user as any).linkedAccounts || [];

        const aptosWallet = linkedAccounts.find(
            (account: any) => account.type === 'wallet' && account.chainType === 'aptos'
        );

        if (!aptosWallet) {
            return NextResponse.json({ error: 'No Aptos wallet found' }, { status: 404 });
        }

        const walletAddress = aptosWallet.address;
        console.log('[Publish Collection] Wallet address:', walletAddress);

        // Use placeholder URL for collection URI
        const collectionUrl = `https://example.com/collection/${Date.now()}`;

        // Build transaction
        const transaction = await aptos.transaction.build.simple({
            sender: walletAddress,
            data: {
                function: `${CONTRACT_ADDRESS}::basic_nft::create_collection`,
                typeArguments: [],
                functionArguments: [name, description, collectionUrl, maxSupply],
            },
        });

        console.log('[Publish Collection] Transaction built');

        // For now, return error explaining we need private key or different signing method
        return NextResponse.json({
            error: 'Server-side signing requires private key access or Privy enterprise features. Transaction built successfully but cannot sign without user interaction.',
            debug: {
                walletAddress,
                transactionBuilt: true,
                suggestion: 'Use Petra Wallet or implement client-side signing with user approval'
            }
        }, { status: 501 });

    } catch (error: any) {
        console.error('[Publish Collection] Error:', error);
        return NextResponse.json({
            error: error?.message || 'Failed to publish collection',
        }, { status: 500 });
    }
}
