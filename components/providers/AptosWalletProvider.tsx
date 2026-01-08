"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PropsWithChildren } from "react";

export const AptosWalletProvider = ({ children }: PropsWithChildren) => {
    const wallets = [new PetraWallet()];

    return (
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
            {children}
        </AptosWalletAdapterProvider>
    );
};
