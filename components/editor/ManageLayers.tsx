"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import ReactFlow, {
    Node,
    Edge,
    applyEdgeChanges,
    applyNodeChanges,
    NodeChange,
    EdgeChange,
    Connection,
    addEdge,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';
import { Settings, Image as ImageIcon, Trash2 } from 'lucide-react';

// Custom Node Component
const CustomLayerNode = ({ data }: { data: { label: string, traits: any[], onSettings: () => void } }) => {
    return (
        <div
            onClick={data.onSettings}
            className="px-4 py-3 shadow-lg rounded-xl bg-background border border-primary/30 min-w-[200px] backdrop-blur-sm relative group hover:border-primary hover:shadow-[0_0_15px_rgba(0,245,255,0.2)] transition-all cursor-pointer"
        >
            <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-primary !border-2 !border-background" />

            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{data.label}</span>
                <Settings className="w-3 h-3 text-muted-foreground group-hover:text-white transition-colors" />
            </div>

            <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                {data.traits && data.traits.map((trait: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[10px] bg-white/5 p-1.5 rounded border border-white/5">
                        <span className="text-gray-300 truncate max-w-[100px]">{trait.name}</span>
                        <span className="font-mono text-primary/80">{trait.rarity}%</span>
                    </div>
                ))}
            </div>

            <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-secondary !border-2 !border-background" />
        </div>
    );
};

const nodeTypes = {
    customLayer: CustomLayerNode,
};

const initialNodes: Node[] = [
    { id: '1', type: 'customLayer', position: { x: 100, y: 100 }, data: { label: 'Background', rarity: 100 } },
    { id: '2', type: 'customLayer', position: { x: 400, y: 50 }, data: { label: 'Body', rarity: 100 } },
    { id: '3', type: 'customLayer', position: { x: 400, y: 200 }, data: { label: 'Head', rarity: 100 } },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#00F5FF' } },
    { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#00F5FF' } },
];

import { LayerSettingsModal } from './LayerSettingsModal';

export const ManageLayers = () => {
    const { user } = usePrivy();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('id');
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const [isLoading, setIsLoading] = useState(!!projectId);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLayer, setSelectedLayer] = useState<any>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const handleSettingsClick = (nodeId: string, nodePosition: { x: number, y: number }, layerData: any) => {
        setSelectedNodeId(nodeId);
        setSelectedLayer({ ...layerData, position: nodePosition }); // Include node position
        setIsModalOpen(true);
    };

    const handleSaveProject = async (currentNodes: Node[], currentEdges: Edge[]) => {
        if (!projectId) return;

        try {
            const layers = currentNodes.map(node => ({
                name: node.data.label,
                traits: node.data.traits,
                description: node.data.description,
                parentLayer: node.data.parentLayer,
                rarity: node.data.rarity,
                position: node.position
            }));

            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ layers })
            });

            if (!response.ok) throw new Error("Failed to save project");
            console.log("✅ Project saved successfully");
        } catch (error) {
            console.error("❌ Failed to save project:", error);
        }
    };

    const handleSaveSettings = (updatedData: any) => {
        // Update the node data and edges in a single pass if possible, or trigger sequentially correctly
        setNodes((nds) => {
            const newNodes = nds.map(node => {
                if (node.id === selectedNodeId) {
                    return {
                        ...node,
                        position: updatedData.position || node.position,
                        data: {
                            ...node.data,
                            label: updatedData.label,
                            description: updatedData.description,
                            position: updatedData.position,
                            rarity: updatedData.rarity,
                            traits: updatedData.traits,
                            parentLayer: updatedData.parentLayer
                        }
                    };
                }
                return node;
            });

            // Calculate new edges based on the updated nodes
            const newEdges: Edge[] = [];
            newNodes.forEach((node) => {
                const nodeData = node.data;
                if (nodeData.parentLayer && nodeData.parentLayer !== '') {
                    const parentNode = newNodes.find(n => n.data.label === nodeData.parentLayer);
                    if (parentNode) {
                        newEdges.push({
                            id: `e-${parentNode.id}-${node.id}`,
                            source: parentNode.id,
                            target: node.id,
                            animated: true,
                            style: { stroke: '#00F5FF' },
                            label: 'child of'
                        });
                    }
                }
            });

            setEdges(newEdges);

            // Auto-save to database
            handleSaveProject(newNodes, newEdges);

            return newNodes;
        });

        setIsModalOpen(false);
    };

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#00F5FF' } }, eds)),
        []
    );

    // Hydrate from DB
    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;

            setIsLoading(true);
            try {
                const response = await fetch(`/api/projects/${projectId}`, {
                    headers: {
                        'x-wallet-address': user?.wallet?.address || ''
                    }
                });

                if (response.status === 403) {
                    console.error("Unauthorized Access");
                    return;
                }

                if (!response.ok) throw new Error("Failed to load project");

                const data = await response.json();
                console.log("Hydrating project from DB:", data);

                if (data.layers && Array.isArray(data.layers)) {
                    const newNodes: Node[] = data.layers.map((layer: any, index: number) => ({
                        id: `ai-${index}`,
                        type: 'customLayer',
                        // Use AI Position if available, else fallback to HORIZONTAL grid
                        position: layer.position ? { x: layer.position.x, y: layer.position.y } : { x: 50 + (index * 350), y: 250 },
                        data: {
                            label: layer.name,
                            traits: layer.traits, // Pass full traits array
                            description: layer.description,
                            parentLayer: layer.parentLayer, // Store parent layer name
                            rarity: layer.rarity
                        }
                    }));

                    // Create edges based on parentLayer relationships
                    const newEdges: Edge[] = [];
                    data.layers.forEach((layer: any, index: number) => {
                        if (layer.parentLayer && layer.parentLayer !== '') {
                            // Find the parent node
                            const parentIndex = data.layers.findIndex((l: any) => l.name === layer.parentLayer);
                            if (parentIndex !== -1) {
                                newEdges.push({
                                    id: `e-${parentIndex}-${index}`,
                                    source: `ai-${parentIndex}`,
                                    target: `ai-${index}`,
                                    animated: true,
                                    style: { stroke: '#00F5FF' },
                                    label: 'child of'
                                });
                            }
                        }
                    });

                    setNodes(newNodes);
                    setEdges(newEdges);
                }
            } catch (e) {
                console.error("Failed to fetch project:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [projectId, user?.wallet?.address]);

    if (isLoading) {
        return (
            <div className="w-full h-[600px] border border-white/10 rounded-xl bg-black/40 backdrop-blur-xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-mono text-muted-foreground animate-pulse">Loading Project...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
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
                    <button
                        onClick={() => handleSaveProject(nodes, edges)}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black transition-colors text-sm font-bold shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                    >
                        Save Layout
                    </button>
                </div>
            </div>

            <div className="w-full h-[600px] border border-white/10 rounded-xl bg-black/40 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 text-xs font-mono text-muted-foreground">
                        Canvas Mode: Edit
                    </div>
                </div>

                <ReactFlow
                    nodes={nodes.map(n => ({
                        ...n,
                        data: {
                            ...n.data,
                            onSettings: () => handleSettingsClick(n.id, n.position, n.data)
                        }
                    }))}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-grid-white/[0.02]"
                >
                    <Background color="#1a1a1a" gap={20} size={1} />
                    <Controls className="react-flow__controls-custom" style={{
                        backgroundColor: '#000',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '4px',
                        fill: '#fff',
                        color: '#fff'
                    }} />
                    <MiniMap
                        nodeColor="#00F5FF"
                        maskColor="rgba(0, 0, 0, 0.7)"
                        style={{
                            backgroundColor: '#000',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px'
                        }}
                    />
                </ReactFlow>

            </div>

            <LayerSettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                layerData={selectedLayer}
                onSave={handleSaveSettings}
                availableLayers={nodes.map(n => n.data.label)}
            />
        </div>
    );
};
