"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useState } from "react";

export const useX402 = () => {
    const { authenticated, user, getAccessToken, login } = usePrivy();
    const [isMinting, setIsMinting] = useState(false);

    const mintCollection = useCallback(async (collectionData: any) => {
        if (!authenticated && !user) {
            console.error("User not authenticated.");
            // For smoother UX, prompt login on generation
            login();
            return { success: false, error: "Please login first" };
        }

        setIsMinting(true);
        console.log("Initiating User Payment (Privy Server-Side)...");

        try {
            // Get Access Token for Server Auth
            const accessToken = await getAccessToken();

            const response = await fetch("/api/pay", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    prompt: collectionData.prompt
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Payment request failed");
            }

            const data = await response.json();
            const txHash = data.txHash;

            console.log("Payment Successful. Tx:", txHash);

            return { success: true, paymentHeader: txHash };

        } catch (error: any) {
            console.error("Payment failed:", error);
            return { success: false, error: error.message || "Payment failed" };
        } finally {
            setIsMinting(false);
        }
    }, [authenticated, user, getAccessToken, login]);

    return { mintCollection, isMinting };
};
