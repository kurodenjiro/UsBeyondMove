import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import {
    Aptos,
    AptosConfig,
    Network,
    AccountAuthenticatorEd25519,
    Ed25519PublicKey,
    Ed25519Signature,
    generateSigningMessageForTransaction,
} from '@aptos-labs/ts-sdk';

const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://testnet.movementnetwork.xyz/v1"
});
const aptos = new Aptos(config);

// Helper to convert Uint8Array to hex
const toHex = (arr: Uint8Array): string => {
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

export function useMovement() {
    const { user } = usePrivy();
    const { signRawHash } = useSignRawHash();

    const signAndSubmitTransaction = async (
        func: string,
        typeArguments: string[] = [],
        functionArguments: any[] = []
    ) => {
        try {
            // Get Aptos wallet from linkedAccounts
            const aptosAccount = user?.linkedAccounts?.find(
                (account: any) => account.type === 'wallet' && account.chainType === 'aptos'
            );

            if (!aptosAccount) {
                throw new Error('No Aptos wallet found. Please create one first.');
            }

            const walletAddress = aptosAccount.address;
            console.log('[Privy Transaction] Using Aptos wallet:', walletAddress);

            // Build the transaction
            const rawTxn = await aptos.transaction.build.simple({
                sender: walletAddress,
                data: {
                    function: func,
                    typeArguments,
                    functionArguments,
                },
            });

            console.log('[Privy Transaction] Transaction built successfully');

            // Generate signing message
            const message = generateSigningMessageForTransaction(rawTxn);
            const hash = `0x${toHex(message)}`;

            console.log('[Privy Transaction] Signing with Privy...');

            // Sign with Privy's useSignRawHash
            const { signature: rawSignature } = await signRawHash({
                address: walletAddress,
                chainType: 'aptos',
                hash,
            });

            console.log('[Privy Transaction] Transaction signed successfully');

            // Get public key
            const publicKey = (aptosAccount as any).publicKey || walletAddress;

            // Clean public key (remove 0x prefix and handle 66-char keys)
            let cleanPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
            if (cleanPublicKey.length === 66) {
                cleanPublicKey = cleanPublicKey.slice(2);
            }

            // Create authenticator
            const senderAuthenticator = new AccountAuthenticatorEd25519(
                new Ed25519PublicKey(cleanPublicKey),
                new Ed25519Signature(rawSignature.startsWith('0x') ? rawSignature.slice(2) : rawSignature)
            );

            console.log('[Privy Transaction] Submitting transaction to blockchain');

            // Submit the signed transaction
            const committedTransaction = await aptos.transaction.submit.simple({
                transaction: rawTxn,
                senderAuthenticator,
            });

            console.log('[Privy Transaction] Transaction submitted:', committedTransaction.hash);

            // Wait for confirmation
            const executed = await aptos.waitForTransaction({
                transactionHash: committedTransaction.hash,
            });

            if (!executed.success) {
                throw new Error('Transaction failed');
            }

            console.log('[Privy Transaction] Transaction confirmed successfully');

            return {
                success: true,
                hash: committedTransaction.hash,
                vmStatus: executed.vm_status,
            };
        } catch (error: any) {
            console.error('❌ Error in signAndSubmitTransaction:', error);
            throw error;
        }
    };

    return {
        signAndSubmitTransaction,
        aptosAddress: user?.linkedAccounts?.find(
            (account: any) => account.type === 'wallet' && account.chainType === 'aptos'
        )?.address,
    };
}
