"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SendTransactionError } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { loadMarkets } from "../lib/markets";
import { AMMPool, createPool, loadPools, Pool, savePool } from "../lib/pools";
import { buildMintToTransaction } from "../lib/solana";

export function PoolManager() {
	const { publicKey, sendTransaction } = useWallet();
	const { connection } = useConnection();
	const [pools, setPools] = useState<Pool[]>([]);
	const [selectedMarket, setSelectedMarket] = useState("");
	const [yesAmount, setYesAmount] = useState(100);
	const [noAmount, setNoAmount] = useState(100);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setPools(loadPools());
	}, []);

	const markets = loadMarkets();

	const onCreatePool = useCallback(async () => {
		if (!publicKey || !selectedMarket) return;
		
		const market = markets.find(m => m.id === selectedMarket);
		if (!market) return;

		setLoading(true);
		try {
			// Mint initial liquidity tokens to the pool creator
			const yesMint = new PublicKey(market.yesMint);
			const noMint = new PublicKey(market.noMint);
			
			// Create pool with initial liquidity
			const pool = createPool(
				market.id,
				market.yesMint,
				market.noMint,
				yesAmount,
				noAmount,
				publicKey.toBase58()
			);

			// In a real implementation, you'd create a pool account on-chain
			// For now, we'll just save it locally and mint some tokens to simulate liquidity
			
			// Mint YES tokens for initial liquidity
			const yesAta = await getAssociatedTokenAddress(yesMint, publicKey);
			const mintYesTx = await buildMintToTransaction({
				mint: yesMint,
				recipientAta: yesAta,
				amount: BigInt(yesAmount * 1_000_000), // 6 decimals
				payer: publicKey
			});
			mintYesTx.feePayer = publicKey;
			const sigYes = await sendTransaction(mintYesTx, connection, { skipPreflight: false });
			await connection.confirmTransaction({ ...(await connection.getLatestBlockhash()), signature: sigYes }, "confirmed");

			// Mint NO tokens for initial liquidity
			const noAta = await getAssociatedTokenAddress(noMint, publicKey);
			const mintNoTx = await buildMintToTransaction({
				mint: noMint,
				recipientAta: noAta,
				amount: BigInt(noAmount * 1_000_000), // 6 decimals
				payer: publicKey
			});
			mintNoTx.feePayer = publicKey;
			const sigNo = await sendTransaction(mintNoTx, connection, { skipPreflight: false });
			await connection.confirmTransaction({ ...(await connection.getLatestBlockhash()), signature: sigNo }, "confirmed");

			// Save pool
			savePool(pool);
			setPools([pool, ...pools]);

			alert(`Pool created for market: ${market.question}`);
		} catch (e) {
			if (e instanceof SendTransactionError) {
				try {
					const logs = await e.getLogs(connection);
					console.error("SendTransactionError logs:", logs);
				} catch {}
			}
			console.error(e);
			alert("Failed to create pool: " + (e as Error).message);
		} finally {
			setLoading(false);
		}
	}, [publicKey, sendTransaction, selectedMarket, yesAmount, noAmount, markets, pools, connection]);

	return (
		<section className="w-full max-w-6xl mx-auto">
			<div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
				<h2 className="text-lg font-medium mb-4">Create Liquidity Pool</h2>
				
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<div>
							<label className="block text-sm text-white/80 mb-2">Select Market</label>
							<select
								value={selectedMarket}
								onChange={(e) => setSelectedMarket(e.target.value)}
								className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
							>
								<option value="">Choose a market...</option>
								{markets.map((market) => (
									<option key={market.id} value={market.id}>
										{market.question}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm text-white/80 mb-2">Initial YES Amount</label>
							<input
								type="number"
								value={yesAmount}
								onChange={(e) => setYesAmount(Number(e.target.value))}
								className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
								placeholder="100"
							/>
						</div>

						<div>
							<label className="block text-sm text-white/80 mb-2">Initial NO Amount</label>
							<input
								type="number"
								value={noAmount}
								onChange={(e) => setNoAmount(Number(e.target.value))}
								className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
								placeholder="100"
							/>
						</div>

						<button
							onClick={onCreatePool}
							disabled={loading || !publicKey || !selectedMarket}
							className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white disabled:opacity-50"
						>
							{loading ? "Creating Pool..." : "Create Pool"}
						</button>
					</div>

					<div className="space-y-4">
						<h3 className="text-sm font-medium text-white/80">Existing Pools</h3>
						<div className="space-y-3 max-h-64 overflow-y-auto">
							{pools.length === 0 ? (
								<p className="text-sm text-white/60">No pools created yet.</p>
							) : (
								pools.map((pool) => {
									const market = markets.find(m => m.id === pool.marketId);
									const amm = new AMMPool(pool.yesReserve, pool.noReserve);
									
									return (
										<div key={pool.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
											<h4 className="text-sm font-medium mb-1">
												{market?.question || "Unknown Market"}
											</h4>
											<div className="text-xs text-white/60 space-y-1">
												<p>YES Price: {(amm.getYesPrice() * 100).toFixed(1)}%</p>
												<p>Liquidity: {pool.totalLiquidity.toFixed(2)}</p>
												<p>Reserves: {pool.yesReserve.toFixed(0)} YES, {pool.noReserve.toFixed(0)} NO</p>
											</div>
										</div>
									);
								})
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

// Helper function to get associated token address
async function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey) {
	const { getAssociatedTokenAddress } = await import("@solana/spl-token");
	return getAssociatedTokenAddress(mint, owner);
}
