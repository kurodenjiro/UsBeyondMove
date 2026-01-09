"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode, useEffect, useState } from "react";

// Placeholder App ID
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clp_123456789012345678901234";

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="animate-pulse">Loading App...</div>
            </div>
        );
    }

    return (
        <PrivyProvider
            appId={PRIVY_APP_ID}
            config={{
                loginMethods: ["email", "wallet"],
                appearance: {
                    theme: "dark",
                    accentColor: "#00F5FF",
                    logo: "https://your-logo-url",
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "users-without-wallets",
                    },
                    aptos: {
                        createOnLogin: "all-users",
                    }
                },
                supportedChains: [{
                    id: 30732,
                    name: "Movement Bardock",
                    network: "movement-bardock",
                    nativeCurrency: {
                        name: "Move",
                        symbol: "MOVE",
                        decimals: 18,
                    },
                    rpcUrls: {
                        default: {
                            http: ["https://testnet.bardock.movementnetwork.xyz/v1"],
                        },
                        public: {
                            http: ["https://testnet.bardock.movementnetwork.xyz/v1"],
                        },
                    },
                }]
            }}
        >
            {children}
        </PrivyProvider>
    );
};
