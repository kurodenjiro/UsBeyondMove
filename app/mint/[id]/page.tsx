"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { Sparkles, Box, CheckCircle } from "lucide-react";
import { useMovement } from "@/hooks/useMovement";

export default function MintPage() {
    const { id } = useParams();
    const { user, authenticated, login } = usePrivy();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [minting, setMinting] = useState(false);
    const [minted, setMinted] = useState(false);
    const [txHash, setTxHash] = useState<string>("");
    const [currentSupply, setCurrentSupply] = useState<number>(0);
    const [maxSupply, setMaxSupply] = useState<number>(100);
    const { signAndSubmitTransaction } = useMovement();

    useEffect(() => {
        if (id) {
            fetchProject();
        }
    }, [id]);

    useEffect(() => {
        if (project) {
            fetchSupply();
        }
    }, [project]);

    const fetchSupply = async () => {
        try {
            // Query blockchain for current supply
            // For now, we'll increment locally after each mint
            // In production, you'd query the smart contract's view function
            console.log('[Supply] Fetching current supply from blockchain...');
        } catch (error) {
            console.error('Failed to fetch supply:', error);
        }
    };

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            }
        } catch (error) {
            console.error("Failed to fetch project:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMint = async () => {
        if (!authenticated) {
            login();
            return;
        }

        setMinting(true);
        try {
            // Use placeholder URL instead of base64 image data
            const nftUri = `https://example.com/nft/${id}/${Date.now()}`;

            // Mint NFT using Privy signing
            const result = await signAndSubmitTransaction(
                "0xb8d93aa049419e32be220fe5c456e25a4fd9287127626a9ea2b9c46cf6734222::basic_nft::mint_nft",
                [], // type arguments
                [
                    project?.name || "Untitled Collection",
                    `${project?.name} #${Math.floor(Math.random() * 10000)}`,
                    project?.prompt || "AI Generated NFT",
                    nftUri, // Use placeholder URL instead of base64
                ]
            );

            console.log("🎉 NFT minted on-chain:", result.hash);
            console.log("📍 Contract: 0xb8d93aa049419e32be220fe5c456e25a4fd9287127626a9ea2b9c46cf6734222::basic_nft");
            console.log("👤 Recipient:", user?.wallet?.address);

            setTxHash(result.hash);
            setCurrentSupply(prev => prev + 1); // Increment supply
            setMinted(true);
        } catch (error: any) {
            console.error("Minting failed:", error);
            alert(error?.message || "Minting failed. Please try again.");
        } finally {
            setMinting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground">
                Project not found.
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Blob */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                {/* Visual */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                >
                    {project.previewImage ? (
                        <img
                            src={project.previewImage}
                            alt={project.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Box className="w-20 h-20 text-white/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute bottom-6 left-6">
                        <span className="px-3 py-1 bg-black/50 backdrop-blur border border-white/10 rounded-full text-xs font-mono mb-2 inline-block">
                            MOVE TESTNET
                        </span>
                        <h2 className="text-3xl font-bold">{project.name}</h2>
                    </div>
                </motion.div>

                {/* Info & Action */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    <div>
                        <h1 className="text-5xl font-bold mb-4 tracking-tight">
                            Mint <span className="text-primary">{project.name}</span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Join the collection on the Movement Network.
                            Secure your unique digital asset today.
                        </p>
                    </div>

                    <div className="flex gap-8 border-y border-white/10 py-6">
                        <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Price</p>
                            <p className="text-2xl font-bold font-mono">0.0 MOVE</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Supply</p>
                            <p className="text-2xl font-bold font-mono">{currentSupply} / {maxSupply}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                            <p className="text-2xl font-bold text-green-400 font-mono flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                LIVE
                            </p>
                        </div>
                    </div>

                    {minted ? (
                        <div className="space-y-4">
                            <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-green-400">Mint Successful!</h3>
                                    <p className="text-sm text-green-400/80">
                                        Your NFT has been minted to your wallet.
                                    </p>
                                </div>
                            </div>

                            {txHash && (
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-2">Transaction Hash:</p>
                                    <a
                                        href={`https://explorer.movementnetwork.xyz/txn/${txHash}?network=testnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:text-primary/80 break-all font-mono"
                                    >
                                        {txHash}
                                    </a>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Click to view on Movement Explorer
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={handleMint}
                            disabled={minting}
                            className="w-full py-6 bg-primary text-black text-xl font-bold rounded-2xl hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(0,245,255,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {minting ? (
                                <Sparkles className="w-6 h-6 animate-spin" />
                            ) : (
                                <Box className="w-6 h-6" />
                            )}
                            {minting ? "Minting..." : (authenticated ? "Mint on Testnet" : "Connect Wallet to Mint")}
                        </button>
                    )}

                    <p className="text-center text-sm text-muted-foreground">
                        Powered by UsBeyondMove & Movement Network
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
