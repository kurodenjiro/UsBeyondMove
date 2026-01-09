import { NextResponse } from 'next/server';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://testnet.movementnetwork.xyz/v1"
});
const aptos = new Aptos(config);

const FAUCET_URL = 'https://faucet.testnet.movementnetwork.xyz/mint';

export async function POST(req: Request) {
    try {
        const { address } = await req.json();

        if (!address) {
            return NextResponse.json({ error: 'Missing address' }, { status: 400 });
        }

        // Pad EVM address to Aptos format (64 hex chars)
        let paddedAddress = address.toLowerCase().replace('0x', '');
        if (paddedAddress.length < 64) {
            paddedAddress = paddedAddress.padStart(64, '0');
        }
        paddedAddress = '0x' + paddedAddress;

        // Check if account exists
        try {
            await aptos.getAccountInfo({ accountAddress: paddedAddress });
            return NextResponse.json({
                exists: true,
                message: 'Account already exists on Movement Testnet'
            });
        } catch (error: any) {
            if (error?.status === 404) {
                // Account doesn't exist - fund it via faucet
                const faucetResponse = await fetch(`${FAUCET_URL}?amount=100000000&address=${paddedAddress}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!faucetResponse.ok) {
                    const errorText = await faucetResponse.text();
                    throw new Error(`Faucet failed: ${faucetResponse.status} ${errorText}`);
                }

                // Wait a bit for the account to be created
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Verify account was created
                await aptos.getAccountInfo({ accountAddress: paddedAddress });

                return NextResponse.json({
                    exists: true,
                    funded: true,
                    message: 'Account created and funded on Movement Testnet'
                });
            }
            throw error;
        }
    } catch (error: any) {
        console.error('Error initializing account:', error);
        return NextResponse.json({
            error: error?.message || 'Failed to initialize account'
        }, { status: 500 });
    }
}
