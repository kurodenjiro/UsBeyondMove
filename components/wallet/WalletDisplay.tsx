"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const WalletDisplay = () => {
    const { user, authenticated, logout } = usePrivy();
    const [balance, setBalance] = useState("0.00");
    const [isCopied, setIsCopied] = useState(false);

    // Mock balance fetching for demo (or use useWallets if detailed)
    useEffect(() => {
        if (authenticated) {
            // Simulate fetching balance
            // Real fetch would be: const bal = await provider.getBalance(address);
            setTimeout(() => setBalance("12.50"), 1000);
        }
    }, [authenticated]);

    const handleCopy = () => {
        const aptosWallet = user?.linkedAccounts?.find(
            (account: any) => account.type === 'wallet' && account.chainType === 'aptos'
        );
        const address = aptosWallet?.address || user?.wallet?.address;

        if (address) {
            navigator.clipboard.writeText(address);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    // Get Movement (Aptos) wallet address
    const aptosWallet = user?.linkedAccounts?.find(
        (account: any) => account.type === 'wallet' && account.chainType === 'aptos'
    );
    const walletAddress = aptosWallet?.address || user?.wallet?.address;

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
