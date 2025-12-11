"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Market, loadMarkets } from "../lib/markets";
import { getPoolState, initializePoolState } from "../lib/poolState";
import { LiquidityPoolInfo } from "../lib/raydium";
import { TradingInterface } from "./TradingInterface";

// --- Helpers for persistent price history tracking ---
const PRICE_HISTORY_KEY = 'futarchy_price_history_v1';

function loadPriceHistory(marketId: string) {
  if (!marketId) return [];
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PRICE_HISTORY_KEY);
    if (!raw) return [];
    const all: Record<string, any[]> = JSON.parse(raw);
    return all[marketId] || [];
  } catch {
    return [];
  }
}

function savePriceHistory(marketId: string, history: any[]) {
  if (!marketId) return;
  if (typeof window === 'undefined') return;
  let all: Record<string, any[]> = {};
  try {
    all = JSON.parse(window.localStorage.getItem(PRICE_HISTORY_KEY) || '{}');
  } catch {}
  all[marketId] = history;
  window.localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(all));
  try { window.dispatchEvent(new Event('price_history_updated')); } catch {}
}
// --- end helpers ---

// Price Graph Component that updates reactively with real prices
function PriceGraph({ marketId, poolId }: { marketId: string; poolId?: string }) {
	const [priceHistory, setPriceHistory] = useState(loadPriceHistory(marketId));
	const [currentPrice, setCurrentPrice] = useState<number | null>(null);
	const [, forceUpdate] = useState(0);

	// Update price history and current price when events fire
	useEffect(() => {
		const updateHistory = () => {
			const newHistory = loadPriceHistory(marketId);
			setPriceHistory(newHistory);
			
			// Get current real price from pool state
			if (poolId) {
				const poolState = getPoolState(poolId);
				if (poolState) {
					const newPrice = poolState.quoteReserve / poolState.baseReserve;
					setCurrentPrice(newPrice);
				}
			}
			forceUpdate(x => x + 1);
		};
		
		// Initial load
		updateHistory();
		
		window.addEventListener('price_history_updated', updateHistory);
		window.addEventListener('pool_state_updated', updateHistory);
		return () => {
			window.removeEventListener('price_history_updated', updateHistory);
			window.removeEventListener('pool_state_updated', updateHistory);
		};
	}, [marketId, poolId]);

	// Get current real price from pool state if not set
	useEffect(() => {
		if (poolId && currentPrice === null) {
			const poolState = getPoolState(poolId);
			if (poolState) {
				setCurrentPrice(poolState.quoteReserve / poolState.baseReserve);
			}
		}
	}, [poolId, currentPrice]);

	// Combine history with current price
	let chartData = priceHistory.length > 0 ? [...priceHistory] : [];
	
	// Always include current price as the latest point
	if (currentPrice !== null) {
		const lastHistoryPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : null;
		// Only add if it's different or if we have no history
		if (lastHistoryPrice === null || Math.abs(lastHistoryPrice - currentPrice) > 0.0001 || chartData.length === 0) {
			// Remove the last point if it's the same timestamp, then add current
			if (chartData.length > 0 && chartData[chartData.length - 1].time === Date.now()) {
				chartData.pop();
			}
			chartData = [...chartData, { time: Date.now(), price: currentPrice }];
		} else if (chartData.length > 0) {
			// Update the last point with current price
			chartData[chartData.length - 1] = { time: Date.now(), price: currentPrice };
		}
	}

	// If no data at all, show current price or placeholder
	if (chartData.length === 0) {
		chartData = [{ time: Date.now(), price: currentPrice || 0.5 }];
	}

	// Format data for chart - show last 50 points max for performance
	const displayData = chartData.slice(-50).map((point, index) => ({
		...point,
		timeLabel: index === chartData.slice(-50).length - 1 ? 'Now' : `T${index}`,
	}));

	// Calculate price change
	const priceChange = chartData.length >= 2 
		? chartData[chartData.length - 1].price - chartData[0].price 
		: 0;
	const priceChangePercent = chartData.length >= 2 && chartData[0].price > 0
		? ((priceChange / chartData[0].price) * 100)
		: 0;

	return (
		<div style={{ width: '100%', height: 200 }}>
			<div className="flex justify-between items-center mb-2">
				<h4 className="text-xs text-white/60">Token Price Graph</h4>
				{currentPrice !== null && (
					<div className="text-xs">
						<span className="text-purple-200">Current: </span>
						<span className="font-bold text-white">${currentPrice.toFixed(4)}</span>
						{priceChangePercent !== 0 && (
							<span className={`ml-2 ${priceChangePercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
								{priceChangePercent > 0 ? '↑' : '↓'} {Math.abs(priceChangePercent).toFixed(2)}%
							</span>
						)}
					</div>
				)}
			</div>
			<ResponsiveContainer>
				<LineChart data={displayData}>
					<XAxis dataKey="timeLabel" hide />
					<YAxis 
						domain={['auto', 'auto']} 
						hide 
						allowDataOverflow={false}
					/>
					<Tooltip 
						formatter={(v: number) => [`$${v.toFixed(4)}`, 'YES Price']}
						labelFormatter={(label) => label === 'Now' ? 'Current Price' : `Point ${label}`}
						contentStyle={{ 
							background: 'rgba(0, 0, 0, 0.8)', 
							border: '1px solid rgba(139, 92, 246, 0.5)',
							borderRadius: '8px',
							color: '#fff'
						}}
					/>
					<Line 
						type="monotone" 
						dataKey="price" 
						stroke="#6366f1" 
						dot={false} 
						strokeWidth={2} 
						isAnimationActive
						activeDot={{ r: 5, fill: '#818cf8', stroke: '#a78bfa', strokeWidth: 2 }}
						animationDuration={300}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

// This component now listens for price updates
export function MarketList({sortKey='new', searchQuery=''}:{sortKey?:string, searchQuery?:string}) {
	const [markets, setMarkets] = useState<Market[]>([]);
	const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
	// Changing below: force rerender when price history changes
	const [, rerender] = useState(0);

	useEffect(() => {
		const load = () => setMarkets(loadMarkets());
		load();
		const onStorage = (e: StorageEvent) => {
			if (e.key === null || e.key === "futarchy_markets_v1") load();
		};
		const onUpdated = () => load();
		const onHistory = () => rerender(x => x + 1);
		const onPoolStateUpdate = () => rerender(x => x + 1);
		window.addEventListener("storage", onStorage);
		window.addEventListener("markets_updated", onUpdated as EventListener);
		window.addEventListener('price_history_updated', onHistory as EventListener);
		window.addEventListener('pool_state_updated', onPoolStateUpdate as EventListener);
		return () => {
			window.removeEventListener("storage", onStorage);
			window.removeEventListener("markets_updated", onUpdated as EventListener);
			window.removeEventListener('price_history_updated', onHistory as EventListener);
			window.removeEventListener('pool_state_updated', onPoolStateUpdate as EventListener);
		};
	}, []);

	// Get real sparkline data from price history and current pool state
	function getSparklineFor(market: Market) {
		const poolId = market.poolId || `pool_${market.id}`;
		const history = loadPriceHistory(market.id);
		const poolState = getPoolState(poolId);
		const currentPrice = poolState ? poolState.quoteReserve / poolState.baseReserve : 0.5;
		
		if (history.length > 0) {
			// Use last 11 data points from history, then add current price
			const recentHistory = history.slice(-11);
			const data = recentHistory.map((point, i) => ({ x: i, y: point.price }));
			
			// Always add current price as the last point
			const lastPrice = data.length > 0 ? data[data.length - 1].y : null;
			if (lastPrice === null || Math.abs(lastPrice - currentPrice) > 0.0001) {
				data.push({ x: data.length, y: currentPrice });
			} else {
				// Update last point with current price
				data[data.length - 1] = { x: data.length - 1, y: currentPrice };
			}
			
			// Pad to 12 points if needed
			while (data.length < 12) {
				const lastPrice = data.length > 0 ? data[data.length - 1].y : currentPrice;
				data.push({ x: data.length, y: lastPrice });
			}
			
			return data.slice(-12); // Return last 12 points
		}
		
		// If no history, show flat line at current real price
		return Array.from({length: 12}, () => ({ x: 0, y: currentPrice }));
	}

	// Get real pool info from stored state
	const getRealPoolInfo = (market: Market): LiquidityPoolInfo => {
		const poolId = market.poolId || `pool_${market.id}`;
		const poolState = getPoolState(poolId);
		
		// Initialize if doesn't exist
		if (!poolState) {
			const initialState = initializePoolState(poolId, 1000, 1000); // Initial 1:1 ratio
			const price = initialState.quoteReserve / initialState.baseReserve;
			const tvl = initialState.baseReserve + initialState.quoteReserve;
			return {
				id: poolId,
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
				baseReserve: initialState.baseReserve.toString(),
				quoteReserve: initialState.quoteReserve.toString(),
				lpSupply: initialState.lpSupply.toString(),
				openOrders: `orders_${market.id}`,
				targetOrders: `target_${market.id}`,
				withdrawQueue: `withdraw_${market.id}`,
				lpVault: `lpvault_${market.id}`,
				owner: market.creator,
				status: 1,
				baseReserveNumber: initialState.baseReserve,
				quoteReserveNumber: initialState.quoteReserve,
				lpSupplyNumber: initialState.lpSupply,
				price: price,
				volume24h: initialState.volume24h,
				fees24h: initialState.fees24h,
				apr: 0,
				tvl: tvl,
				createdAt: market.createdAt,
				feeRate: 0.003,
				isActive: true,
			};
		}
		
		const price = poolState.quoteReserve / poolState.baseReserve;
		const tvl = poolState.baseReserve + poolState.quoteReserve;
		
		return {
			id: poolId,
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
			baseReserve: poolState.baseReserve.toString(),
			quoteReserve: poolState.quoteReserve.toString(),
			lpSupply: poolState.lpSupply.toString(),
			openOrders: `orders_${market.id}`,
			targetOrders: `target_${market.id}`,
			withdrawQueue: `withdraw_${market.id}`,
			lpVault: `lpvault_${market.id}`,
			owner: market.creator,
			status: 1,
			baseReserveNumber: poolState.baseReserve,
			quoteReserveNumber: poolState.quoteReserve,
			lpSupplyNumber: poolState.lpSupply,
			price: price,
			volume24h: poolState.volume24h,
			fees24h: poolState.fees24h,
			apr: 0,
			tvl: tvl,
			createdAt: market.createdAt,
			feeRate: 0.003,
			isActive: true,
		};
	};

	// Filter markets by search query
	const filteredMarkets = searchQuery?.trim()
		? markets.filter(m => m.question.toLowerCase().includes(searchQuery.toLowerCase()))
		: markets;

	// Sort markets properly based on sortKey
	const sortedMarkets = [...filteredMarkets].sort((a, b) => {
		const poolA = getRealPoolInfo(a);
		const poolB = getRealPoolInfo(b);
		
		if (sortKey === 'new') {
			// Newest first (highest createdAt timestamp)
			return (b.createdAt || 0) - (a.createdAt || 0);
		} else if (sortKey === 'liq') {
			// Most liquidity first (highest TVL)
			return poolB.tvl - poolA.tvl;
		} else if (sortKey === 'trend') {
			// Trending: highest volume first
			return poolB.volume24h - poolA.volume24h;
		}
		return 0;
	});

	// When market selected, if price history is empty, seed it with the current price
	useEffect(() => {
		if (!selectedMarket) return;
		const m = markets.find(x => x.id === selectedMarket);
		if (!m) return;
		const poolInfo = getRealPoolInfo(m);
		const hist = loadPriceHistory(m.id);
		if (hist.length === 0) {
			const seed = [{ time: Date.now(), price: poolInfo.price }];
			savePriceHistory(m.id, seed);
		}
	}, [selectedMarket, markets]);

	return (
		<section className="w-full max-w-6xl mx-auto">
			<h2 className="text-lg font-medium mb-3">Active markets</h2>
			{searchQuery && (
				<div className="mb-4 text-sm text-purple-200">
					Found {sortedMarkets.length} market{sortedMarkets.length !== 1 ? 's' : ''} matching "{searchQuery}"
				</div>
			)}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{sortedMarkets.length === 0 ? (
					<div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-5">
						<h3 className="font-medium">No markets found</h3>
						<p className="text-sm text-white/60">
							{searchQuery ? `No markets match "${searchQuery}". Try a different search.` : "Create a question to launch YES/NO tokens and open a market."}
						</p>
					</div>
				) : (
					sortedMarkets.map((m) => {
						const poolInfo = getRealPoolInfo(m);
						const isSelected = selectedMarket === m.id;
						
						return (
							<div key={m.id} className="space-y-4 animate-fadeIn transition-all duration-300">
								<div 
									className={`rounded-2xl border backdrop-blur-lg p-5 cursor-pointer transition-all duration-200 ${
										isSelected 
											? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg scale-[1.02]' 
											: 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-400/30 hover:shadow-md hover:scale-[1.01]'
									}`}
									onClick={() => setSelectedMarket(isSelected ? null : m.id)}
								>
									<div className="flex items-center justify-between mb-2">
										<h3 className="font-medium mb-1 flex-1">{m.question}</h3>
										{/* Sparkline */}
										<div className="h-7 ml-3 w-20">
											<ResponsiveContainer width="100%" height="100%">
												<LineChart data={getSparklineFor(m)}>
													<Line type="monotone" dataKey="y" stroke="#a78bfa" strokeWidth={2} dot={false} isAnimationActive />
												</LineChart>
											</ResponsiveContainer>
										</div>
									</div>
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
									<>
										<TradingInterface poolInfo={poolInfo} marketId={m.id} />
										<div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
											<h4 className="text-sm font-semibold text-purple-200 mb-3">Price History Graph</h4>
											<PriceGraph marketId={m.id} poolId={m.poolId} />
											<div className="mt-3 flex justify-between text-xs text-white/60">
												<div>
													<span className="text-purple-300">Base Reserve (YES):</span> {poolInfo.baseReserveNumber.toFixed(2)}
												</div>
												<div>
													<span className="text-purple-300">Quote Reserve (NO):</span> {poolInfo.quoteReserveNumber.toFixed(2)}
												</div>
											</div>
										</div>
									</>
								)}
							</div>
						);
					})
				)}
			</div>
		</section>
	);
}
