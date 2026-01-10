"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useState } from "react";
import { useMovement } from "./useMovement";

const PAYMENT_RECIPIENT = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT || "0xab17a7a513c015797c555365511bd2918841fac2cb49553757421cb47eb71110";
const PAYMENT_AMOUNT = 1_000_000; // 0.01 MOVE (8 decimals)

export const useX402 = () => {
    const { authenticated, user, login } = usePrivy();
    const { signAndSubmitTransaction } = useMovement();
    const [isMinting, setIsMinting] = useState(false);

    const mintCollection = useCallback(async (collectionData: any) => {
        if (!authenticated && !user) {
            console.error("User not authenticated.");
            login();
            return { success: false, error: "Please login first" };
        }

        setIsMinting(true);
        console.log("Initiating User Payment (0.01 MOVE)...");

        try {
            // Client-Side Payment
            const result = await signAndSubmitTransaction(
                "0x1::aptos_account::transfer",
                [],
                [PAYMENT_RECIPIENT, PAYMENT_AMOUNT]
            );

            console.log("Payment Successful. Tx:", result.hash);

            return { success: true, paymentHeader: result.hash };

        } catch (error: any) {
            console.error("Payment failed:", error);
            // If user rejects or error
            return { success: false, error: error.message || "Payment failed" };
        } finally {
            setIsMinting(false);
        }
    }, [authenticated, user, login, signAndSubmitTransaction]);

    return { mintCollection, isMinting };
};
