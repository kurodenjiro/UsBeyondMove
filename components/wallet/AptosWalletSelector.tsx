"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

export const AptosWalletSelector = () => {
    const { connect, disconnect, account, connected, wallets } = useWallet();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    if (connected && account) {
        return (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono text-primary">
                    {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
                </span>
                <button
                    onClick={() => disconnect()}
                    className="ml-2 text-xs text-muted-foreground hover:text-white"
                >
                    (Disconnect)
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => {
                const petra = wallets.find(w => w.name === "Petra");
                if (petra) connect(petra.name);
                else alert("Petra Wallet not found. Please install usage.");
            }}
            className="bg-primary hover:bg-primary/90 text-black text-sm font-semibold px-5 py-2 rounded-full shadow-[0_0_10px_rgba(0,245,255,0.3)] hover:shadow-[0_0_20px_rgba(0,245,255,0.5)] transition-all cursor-pointer flex items-center gap-2"
        >
            <Wallet className="w-4 h-4" />
            Connect Petra
        </button>
    );
};
