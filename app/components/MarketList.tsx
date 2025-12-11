"use client";

import { useEffect, useState } from "react";
import { Market, loadMarkets } from "../lib/markets";
import { LiquidityPoolInfo } from "../lib/raydium";
import { TradingInterface } from "./TradingInterface";

export function MarketList() {
	const [markets, setMarkets] = useState<Market[]>([]);
	const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

	useEffect(() => {
		const load = () => setMarkets(loadMarkets());
		load();
		const onStorage = (e: StorageEvent) => {
			if (e.key === null || e.key === "futarchy_markets_v1") load();
		};
		const onUpdated = () => load();
		window.addEventListener("storage", onStorage);
		window.addEventListener("markets_updated", onUpdated as EventListener);
		return () => {
			window.removeEventListener("storage", onStorage);
			window.removeEventListener("markets_updated", onUpdated as EventListener);
		};
	}, []);

	// Mock pool data for demonstration (using new Raydium structure)
	const getMockPoolInfo = (market: Market): LiquidityPoolInfo => ({
		id: market.poolId || `pool_${market.id}`,
		baseMint: market.yesMint,
		quoteMint: market.noMint,
		lpMint: market.lpMint || `lp_${market.id}`,
		baseVault: `vault_a_${market.id}`,
		quoteVault: `vault_b_${market.id}`,
		authority: `auth_${market.id}`,
		marketId: `market_${market.id}`,
		marketProgramId: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
		marketBaseVault: `mvault_a_${market.id}`,
		marketQuoteVault: `mvault_b_${market.id}`,
		marketBids: `bids_${market.id}`,
		marketAsks: `asks_${market.id}`,
		marketEventQueue: `queue_${market.id}`,
		lookupTableAccount: "",
		baseReserve: "1000000000",
		quoteReserve: "1000000000", 
		lpSupply: "1000000000",
		openOrders: `orders_${market.id}`,
		targetOrders: `target_${market.id}`,
		withdrawQueue: `withdraw_${market.id}`,
		lpVault: `lpvault_${market.id}`,
		owner: market.creator,
		status: 1,
		// Real-time data
		baseReserveNumber: 1000 + Math.random() * 500,
		quoteReserveNumber: 1000 + Math.random() * 500,
		lpSupplyNumber: 1000,
		price: 0.5 + Math.random() * 0.3,
		volume24h: Math.random() * 10000,
		fees24h: Math.random() * 100,
		apr: Math.random() * 20,
		tvl: 2000 + Math.random() * 1000,
		createdAt: market.createdAt,
		feeRate: 0.003,
		isActive: true,
	});

	return (
		<section className="w-full max-w-6xl mx-auto">
			<h2 className="text-lg font-medium mb-3">Active markets</h2>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{markets.length === 0 ? (
					<div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-5">
						<h3 className="font-medium">No markets yet</h3>
						<p className="text-sm text-white/60">Create a question to launch YES/NO tokens and open a market.</p>
					</div>
				) : (
					markets.map((m) => {
						const poolInfo = getMockPoolInfo(m);
						const isSelected = selectedMarket === m.id;
						
						return (
							<div key={m.id} className="space-y-4">
								<div 
									className={`rounded-2xl border backdrop-blur-lg p-5 cursor-pointer transition-all ${
										isSelected 
											? 'border-indigo-500/50 bg-indigo-500/10' 
											: 'border-white/10 bg-white/5 hover:bg-white/10'
									}`}
									onClick={() => setSelectedMarket(isSelected ? null : m.id)}
								>
									<h3 className="font-medium mb-1">{m.question}</h3>
									<div className="grid grid-cols-2 gap-2 text-xs text-white/60">
										<div>
											<p>YES: {m.yesMint.slice(0, 8)}...</p>
											<p className="text-green-400">${poolInfo.price.toFixed(4)}</p>
										</div>
										<div>
											<p>NO: {m.noMint.slice(0, 8)}...</p>
											<p className="text-red-400">${(1/poolInfo.price).toFixed(4)}</p>
										</div>
									</div>
									{m.poolId && (
										<p className="text-xs text-blue-400 mt-2">LP Pool: {m.poolId.slice(0, 8)}...</p>
									)}
									<div className="flex justify-between items-center mt-3">
										<p className="text-xs text-white/60">TVL: ${poolInfo.tvl.toFixed(0)}</p>
										<p className="text-xs text-white/60">Volume: ${poolInfo.volume24h.toFixed(0)}</p>
									</div>
									<p className="text-xs text-white/60 mt-1">Creator: {m.creator.slice(0, 8)}...</p>
								</div>
								
								{isSelected && (
									<TradingInterface poolInfo={poolInfo} marketId={m.id} />
								)}
							</div>
						);
					})
				)}
			</div>
		</section>
	);
}
