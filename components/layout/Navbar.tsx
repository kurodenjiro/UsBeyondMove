"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { Copy, Menu, Sparkles, LayoutGrid, Layers, Settings, Globe } from "lucide-react";
import { WalletDisplay } from "@/components/wallet/WalletDisplay";

export const Navbar = () => {
    const { login, authenticated, user, logout } = usePrivy();

    return (
        <nav className="fixed top-0 w-full border-b border-white/10 bg-background/80 backdrop-blur-md z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 group-hover:shadow-[0_0_15px_rgba(0,245,255,0.5)] transition-all">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">
                        AI <span className="text-primary">NFT</span>
                    </span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Generate
                    </Link>
                    <Link href="/collections" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Collections
                    </Link>
                    <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Explore
                    </Link>
                    <Link href="/my-nfts" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" /> My NFTs
                    </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">

                    {authenticated ? (
                        <WalletDisplay />
                    ) : (
                        <button
                            onClick={login}
                            className="bg-primary hover:bg-primary/90 text-black text-sm font-semibold px-5 py-2 rounded-full shadow-[0_0_10px_rgba(0,245,255,0.3)] hover:shadow-[0_0_20px_rgba(0,245,255,0.5)] transition-all cursor-pointer"
                        >
                            Connect Wallet
                        </button>
                    )}

                    <button className="md:hidden text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </nav >
    );
};
