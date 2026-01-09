"use client";

import { motion } from "framer-motion";
import { Sparkles, Settings2, Box, Layers, Zap } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useX402 } from "@/hooks/useX402";
import { usePrivy } from "@privy-io/react-auth";
import { ModelSelector } from "@/components/dashboard/ModelSelector";
import { StyleSelector } from "@/components/dashboard/StyleSelector";
import { AdvancedSettings } from "@/components/dashboard/AdvancedSettings";

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedUpscale, setSelectedUpscale] = useState("Original");
  const [supply, setSupply] = useState(8);
  const { mintCollection } = useX402();
  const { user } = usePrivy();

  const [status, setStatus] = useState<string>("");

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setStatus("Initiating Payment...");

    try {
      // 1. Payment Flow
      const { success, paymentHeader, error } = await mintCollection({ prompt });
      if (!success || !paymentHeader) {
        console.error("Payment failed", error);
        setStatus(error || "Payment Failed");
        return;
      }

      // 2. Analysis Flow (The Architect)
      setStatus("Analyzing Concept...");
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-Hash': paymentHeader // Send the x402 proof header
        },
        body: JSON.stringify({
          prompt,
          aspectRatio: selectedRatio,
          upscale: selectedUpscale
        })
      });
      const analysisData = await analyzeResponse.json();
      console.log("--- ANALYSIS RESULT ---");
      console.log(analysisData);
      console.log("-----------------------");

      if (!analysisData.layers) throw new Error("Failed to analyze layers");

      // 3. Save to DB and Redirect
      setStatus("Saving Project...");

      const saveResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          layers: analysisData.layers,
          ownerAddress: user?.wallet?.address,
          aspectRatio: selectedRatio,
          upscale: selectedUpscale
        })
      });

      if (!saveResponse.ok) throw new Error("Failed to save project");

      const { id } = await saveResponse.json();

      setStatus("Redirecting to Editor...");
      router.push(`/nft-generate-editor?id=${id}`);
      return;

      /* 
      // LEGACY: Generation Flow (The Artist)
      setStatus(`Generating ${analysisData.layers.length} Layers...`);
      const generatedLayers = [];

      for (const layer of analysisData.layers) {
        setStatus(`Generating ${layer.name}...`);
        const imageResponse = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment-Hash': paymentHeader // Send the x402 proof header
          },
          body: JSON.stringify({ prompt: layer.description, style: selectedStyle })
        });
        const imageData = await imageResponse.json();
        generatedLayers.push({ ...layer, url: imageData.url });
      }

      console.log("Final Generated Assets:", generatedLayers);
      setStatus("Generation Complete!");
      */

      console.log("Final Generated Assets:", generatedLayers);
      setStatus("Generation Complete!");

    } catch (e) {
      console.error("Generation error:", e);
      setStatus("Error during generation");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] container mx-auto px-4 relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter">
          Generate <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">NFTs</span> with AI.
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
          Create and deploy ultra-high quality NFT artwork in seconds on the Movement Network.
        </p>
      </motion.div>

      {/* Main Input Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-4xl relative z-20"
      >
        <div className="bg-background/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="A collection of cute cyberpunk robots..."
            className="flex-1 bg-transparent border-none text-lg px-6 py-4 focus:ring-0 text-white placeholder:text-muted-foreground outline-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex items-center gap-2 px-2">
            <button
              onClick={() => {
                const prompts = [
                  "A collection NFT of cyberpunk PFP NFT",
                  "A collection NFT of anime PFP NFT",
                  "A collection NFT of Rick and Morty PFP NFT",
                  "A collection NFT of Ghibi NFT",
                ];
                setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
              }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
              title="Recommend a prompt"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90 text-black font-bold px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className={`w-5 h-5 fill-current ${isGenerating ? 'animate-pulse' : ''}`} />
              {isGenerating ? (status || 'PROCESSING...') : 'GENERATE'}
            </button>
          </div>
        </div>

        {/* Controls / Settings */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <ModelSelector />
          <div
            onClick={() => setIsStyleOpen(true)}
            className="bg-black/40 backdrop-blur border border-white/5 rounded-full px-6 py-3 flex items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer group"
          >
            <Box className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium">Add Styles +</span>
          </div>

          <div className="bg-black/40 backdrop-blur border border-white/5 rounded-full px-6 py-3 flex items-center gap-3 hover:border-primary/50 transition-colors group relative">
            <Layers className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Supply:</span>
              <input
                type="number"
                min="1"
                max="8"
                value={supply}
                onChange={(e) => setSupply(parseInt(e.target.value) || 1)}
                className="w-16 bg-transparent border-none focus:ring-0 text-sm font-bold text-primary p-0 outline-none"
              />
            </div>
          </div>

          <div
            onClick={() => setIsAdvancedOpen(true)}
            className="bg-black/40 backdrop-blur border border-white/5 rounded-full px-6 py-3 flex items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer group"
          >
            <Settings2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium">Advanced Settings</span>
          </div>
        </div>
      </motion.div>

      <StyleSelector
        isOpen={isStyleOpen}
        onClose={() => setIsStyleOpen(false)}
        selectedStyle={selectedStyle}
        onSelect={setSelectedStyle}
      />

      <AdvancedSettings
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        selectedRatio={selectedRatio}
        setSelectedRatio={setSelectedRatio}
        selectedUpscale={selectedUpscale}
        setSelectedUpscale={setSelectedUpscale}
      />
    </div>
  );
}
