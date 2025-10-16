"use client";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";
import { FC, ReactNode, useEffect, useMemo } from "react";

// Polyfill Buffer for certain wallets on web
if (typeof window !== "undefined" && !(window as any).Buffer) {
	(async () => {
		const { Buffer } = await import("buffer");
		(window as any).Buffer = Buffer;
	})();
}

interface SolanaProvidersProps {
	networkRpcUrl?: string;
	children: ReactNode;
}

const DEFAULT_RPC = clusterApiUrl("devnet");

export const SolanaProviders: FC<SolanaProvidersProps> = ({
	networkRpcUrl,
	children,
}) => {
	const endpoint = networkRpcUrl || DEFAULT_RPC;
	const wallets = useMemo(() => [
		new PhantomWalletAdapter(),
		new SolflareWalletAdapter(),
	], []);

	useEffect(() => {
		// Ensure Phantom is ready on client
	}, []);

	console.log("wallets : " , wallets);
	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider >{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
};
