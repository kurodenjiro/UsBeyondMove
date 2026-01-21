import { useState } from "react";
import { useMovement } from "./useMovement";
import { usePrivy } from "@privy-io/react-auth";

// Placeholder Module Address - SHOULD BE IN ENV
const FACTORY_MODULE = process.env.NEXT_PUBLIC_FACTORY_MODULE || "0xb8d93aa049419e32be220fe5c456e25a4fd9287127626a9ea2b9c46cf6734222";
const MODULE_NAME = "basic_nft";

export const useUsBeyond = () => {
    const { user, authenticated, login } = usePrivy();
    const { signAndSubmitTransaction, aptosAddress } = useMovement();
    const [isLoading, setIsLoading] = useState(false);

    // 1. Create Collection via Factory (Move Contract)
    const createCollection = async (name: string, symbol: string) => {
        if (!authenticated || !aptosAddress) {
            console.error("User not authenticated");
            login();
            return null;
        }

        setIsLoading(true);
        console.log("Creating collection on Movement...", { name, symbol });

        try {
            // Contract expects: create_collection(name: String, description: String, uri: String, max_supply: u64)
            const description = `Collection for ${name}`;
            const uri = "https://example.com"; // Placeholder, can be updated later
            const maxSupply = 1000; // Default max supply

            const result = await signAndSubmitTransaction(
                `${FACTORY_MODULE}::${MODULE_NAME}::create_collection`,
                [],
                [name, description, uri, maxSupply]
            );

            console.log("Factory Transaction Sent:", result.hash);

            // On Aptos, we might not get the created address in the receipt as easily as EVM logs without an indexer or event parsing.
            // For now, return the hash.
            // In a real app, you'd likely fetch the resources of the account to find the new collection.
            return { hash: result.hash, address: `${FACTORY_MODULE}::${MODULE_NAME}::Collection` }; // Placeholder return

        } catch (error) {
            console.error("Failed to create collection:", error);
            // Don't throw, just return null so UI handles it
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Mint NFT on Collection
    const mintNFT = async (collectionAddress: string, to: string, uri: string) => {
        if (!authenticated || !aptosAddress) {
            console.error("User not authenticated");
            login();
            return null;
        }

        setIsLoading(true);
        try {
            // Assume Move function: public entry fun mint_nft(to: address, uri: String)
            const result = await signAndSubmitTransaction(
                `${FACTORY_MODULE}::${MODULE_NAME}::mint_nft`,
                [],
                [to, uri]
            );

            console.log("Mint Transaction Sent:", result.hash);
            return result.hash;

        } catch (error) {
            console.error("Mint failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Fetch My NFTs
    // Fetching data on Aptos typically uses current account resources or an Indexer API.
    // Making this a placeholder or using a simple resource fetch if possible.
    const fetchMyNFTsFromChain = async () => {
        // TODO: Implement fetching using Aptos Client (aptos.getAccountResources or Indexer)
        // This requires knowing the exact resource structure of the Move module.
        console.log("Fetching NFTs from chain not yet implemented for Movement.");
        return [];
    };

    return {
        createCollection,
        mintNFT,
        fetchMyNFTsFromChain,
        isLoading,
        userAddress: aptosAddress,
        isConnected: authenticated
    };
};

