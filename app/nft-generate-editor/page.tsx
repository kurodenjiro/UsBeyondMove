import { ManageLayers } from "@/components/editor/ManageLayers";

export default function OrganizePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                        Asset Organizer
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Visualize and manage your NFT layer dependencies.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium border border-white/5">
                        Import Assets
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black transition-colors text-sm font-bold shadow-[0_0_15px_rgba(0,245,255,0.3)]">
                        Save Layout
                    </button>
                </div>
            </div>

            <ManageLayers />
        </div>
    );
}
