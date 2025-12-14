"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const nav = [
	{ href: "/", label: "Home" },
	{ href: "/create", label: "Create" },
	{ href: "/markets", label: "Markets" },
	{ href: "/about", label: "About" },
];

export function Header() {
	const { publicKey, wallets, select, connect, disconnect, connected } = useWallet();
	const [open, setOpen] = useState(false);

	const label = useMemo(() => {
		if (!publicKey) return "Connect Wallet";
		const base58 = publicKey.toBase58();
		return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
	}, [publicKey]);

	const available = useMemo(() =>
		wallets.filter((w) => {
			const n = w.adapter.name;
			return (n.includes("Phantom") || n.includes("Solflare")) && (w.readyState === "Installed" || w.readyState === "Loadable");
		}),
		[wallets]
	);

	async function onSelect(name: string) {
		try {
			// Verify wallet is available
			const chosen = wallets.find((w) => w.adapter.name === name);
			if (!chosen || (chosen.readyState !== "Installed" && chosen.readyState !== "Loadable")) {
				console.warn("Wallet not ready:", name);
				setOpen(false);
				return;
			}

			// Select the wallet
			select(name as any);
			
			// Wait a moment for wallet to initialize, then connect
			await new Promise(resolve => setTimeout(resolve, 100));
			try {
				await connect();
				setOpen(false);
			} catch (e: any) {
				console.error("Connection error:", e);
				setOpen(false);
			}
		} catch (e: any) {
			console.error("Wallet selection error:", e);
			setOpen(false);
		}
	}

	const handleWalletButtonClick = () => {
		if (connected) {
			disconnect();
		} else {
			setOpen(!open);
		}
	};

	return (
		<header className="sticky top-0 z-30 w-full">
			<div className="mx-auto max-w-6xl px-6 py-3">
				<div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/10 dark:supports-[backdrop-filter]:bg-black/20">
					<div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
					<div className="flex items-center justify-between px-4 py-3">
						<Link href="/" className="flex items-center gap-3">
							<div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500" />
							<span className="text-sm font-semibold tracking-tight">DeFutarchy</span>
						</Link>
						<nav className="hidden md:flex items-center gap-2">
							{nav.map((n) => (
								n.href.startsWith("/") ? (
									<Link key={n.href} href={n.href} className="px-3 py-1.5 rounded-full text-sm border border-white/10 text-white/80 hover:text-white hover:bg-white/10">
										{n.label}
									</Link>
								) : (
									<a key={n.href} href={n.href} className="px-3 py-1.5 rounded-full text-sm border border-white/10 text-white/80 hover:text-white hover:bg-white/10">
										{n.label}
									</a>
								)
							))}
						</nav>
						<div className="relative">
							<button 
								onClick={handleWalletButtonClick} 
								className="rounded-xl px-4 py-2 h-auto border border-white/10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
							>
								{connected ? label : "Connect Wallet"}
							</button>
							{!connected && open && (
								<div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-white/10 backdrop-blur p-2 shadow-lg z-50">
									{available.length === 0 ? (
										<div className="text-sm text-white/70 px-2 py-2">No supported wallets detected.</div>
									) : (
										available.map((w) => (
											<button 
												key={w.adapter.name} 
												onClick={() => onSelect(w.adapter.name)} 
												className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/10"
											>
												{w.adapter.name}
											</button>
										))
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}

