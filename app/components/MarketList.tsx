"use client";

import { useEffect, useState } from "react";
import { Market, loadMarkets } from "../lib/markets";

export function MarketList() {
	const [markets, setMarkets] = useState<Market[]>([]);

	useEffect(() => {
		setMarkets(loadMarkets());
	}, []);

	return (
		<section className="w-full max-w-6xl mx-auto">
			<h2 className="text-lg font-medium mb-3">Active markets</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				{markets.length === 0 ? (
					<div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-5">
						<h3 className="font-medium">No markets yet</h3>
						<p className="text-sm text-white/60">Create a question to launch YES/NO tokens and open a market.</p>
					</div>
				) : (
					markets.map((m) => (
						<div key={m.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-5">
							<h3 className="font-medium mb-1">{m.question}</h3>
							<p className="text-xs text-white/60">YES mint: {m.yesMint}</p>
							<p className="text-xs text-white/60">NO mint: {m.noMint}</p>
							<p className="text-xs text-white/60 mt-1">Creator: {m.creator}</p>
						</div>
					))
				)}
			</div>
		</section>
	);
}
