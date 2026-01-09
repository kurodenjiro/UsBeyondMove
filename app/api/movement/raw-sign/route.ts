import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!
);

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

        const body = await req.json();
        const { address, chainType, hash } = body;

        // Log payload size for debugging
        const payloadSize = JSON.stringify(body).length;
        console.log('[Raw Sign Proxy] Payload size:', payloadSize, 'bytes');

        if (payloadSize > 1000) {
            console.log('[Raw Sign Proxy] Hash length:', hash?.length);
            console.log('[Raw Sign Proxy] Hash preview:', hash?.substring(0, 200));
        }

        if (!address || !chainType || !hash) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate hash isn't too large (should be ~66 chars for 0x + 64 hex)
        if (hash.length > 1000) {
            return NextResponse.json({
                error: `Hash is too large (${hash.length} chars). Expected ~66 characters. This might be image data instead of a hash.`,
                hint: 'Check that previewImage is a URL, not base64 data'
            }, { status: 400 });
        }

        console.log('[Raw Sign Proxy] User:', userId);
        console.log('[Raw Sign Proxy] Address:', address);

        // Get user's wallets
        const user = await privy.getUser(userId);
        const linkedAccounts = (user as any).linkedAccounts || [];

        const aptosWallet = linkedAccounts.find(
            (account: any) => {
                return account.type === 'wallet' &&
                    (account.chainType === 'aptos' || account.chain_type === 'aptos') &&
                    account.address === address;
            }
        );

        if (!aptosWallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        // Debug: log wallet object to find correct property name
        console.log('[Raw Sign Proxy] Wallet object keys:', Object.keys(aptosWallet));
        console.log('[Raw Sign Proxy] Wallet object:', JSON.stringify(aptosWallet, null, 2));

        const walletId = aptosWallet.walletId || aptosWallet.wallet_id || aptosWallet.id;

        if (!walletId) {
            return NextResponse.json({
                error: 'Wallet ID not found',
                debug: { walletKeys: Object.keys(aptosWallet) }
            }, { status: 400 });
        }

        console.log('[Raw Sign Proxy] Wallet ID:', walletId);

        // Call Privy's raw_sign API with correct authentication
        const signUrl = `https://auth.privy.io/api/v1/wallets/${walletId}/raw_sign`;

        // Create Basic auth header
        const authString = `${process.env.NEXT_PUBLIC_PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`;
        const basicAuth = Buffer.from(authString).toString('base64');

        const response = await fetch(signUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${basicAuth}`,
                'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
            },
            body: JSON.stringify({
                params: {
                    hash: hash.startsWith('0x') ? hash : `0x${hash}`,
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Raw Sign Proxy] Privy API error:', response.status, errorText);
            throw new Error(`Privy API failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('[Raw Sign Proxy] Signature obtained');

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[Raw Sign Proxy] Error:', error);
        return NextResponse.json({
            error: error?.message || 'Failed to sign',
        }, { status: 500 });
    }
}
