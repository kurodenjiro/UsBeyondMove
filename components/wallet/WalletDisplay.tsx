"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const WalletDisplay = () => {
    const { user, authenticated, logout } = usePrivy();
    const [balance, setBalance] = useState("0.00");
    const [isCopied, setIsCopied] = useState(false);

    // Get Movement (Aptos) wallet address
    const aptosWallet = user?.linkedAccounts?.find(
        (account: any) => account.type === 'wallet' && account.chainType === 'aptos'
    );
    const walletAddress = (aptosWallet as any)?.address || user?.wallet?.address;

    // Mock balance fetching for demo (or use useWallets if detailed)
    useEffect(() => {
        const fetchBalance = async () => {
            if (authenticated && walletAddress) {
                try {
                    const rpcUrl = process.env.NEXT_PUBLIC_MOVEMENT_RPC_URL || "https://testnet.movementnetwork.xyz/v1";
                    console.log(`[WalletDisplay] Fetching balance for ${walletAddress}`);
                    console.log(`[WalletDisplay] Using RPC: ${rpcUrl}`);

                    // Initialize Aptos Client (Movement Testnet)
                    const { Aptos, AptosConfig, Network } = await import("@aptos-labs/ts-sdk");
                    const config = new AptosConfig({
                        network: Network.CUSTOM,
                        fullnode: rpcUrl
                    });
                    const aptos = new Aptos(config);

                    const resource = await aptos.getAccountResource({
                        accountAddress: walletAddress,
                        resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
                    });

                    console.log(`[WalletDisplay] Resource fetched:`, resource);

                    // Safe access
                    const data = (resource as any).data || (resource as any); // Fallback if structure differs
                    const coin = data?.coin;

                    if (coin && coin.value) {
                        const formatted = (Number(coin.value) / 100_000_000).toFixed(4);
                        setBalance(formatted);
                    } else {
                        console.warn("[WalletDisplay] Coin data not found in resource");
                    }
                } catch (e) {
                    console.error("Failed to fetch balance:", e);
                    // Keep 0.00 if failed (or loading state)
                }
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 5000); // Poll every 5s for updates
        return () => clearInterval(interval);
    }, [authenticated, walletAddress]);

    const handleCopy = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    if (!authenticated || !walletAddress) return null;

    const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    return (
        <div className="flex items-center gap-2 pl-4 pr-1 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-all select-none">
            {/* Balance Section */}
            <div className="flex items-center gap-2 mr-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-bold text-white tracking-tight">{balance} MOVE</span>
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-white/20" />

            {/* Address Section */}
            <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 cursor-pointer transition-colors group relative"
                onClick={handleCopy}
            >
                <span className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
                    {isCopied ? "Copied!" : shortAddress}
                </span>
                {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />}
            </div>

            {/* Logout Button */}
            <button
                onClick={logout}
                className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-muted-foreground transition-all ml-1"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    );
};
