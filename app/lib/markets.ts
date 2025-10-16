export type Market = {
	id: string;
	question: string;
	yesMint: string;
	noMint: string;
	creator: string;
	createdAt: number;
	poolId?: string;
	lpMint?: string;
};

const STORAGE_KEY = "futarchy_markets_v1";

export function loadMarkets(): Market[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Market[]) : [];
	} catch {
		return [];
	}
}

export function saveMarket(market: Market) {
	if (typeof window === "undefined") return;
	const current = loadMarkets();
	const updated = [market, ...current];
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	// Notify listeners that markets changed
	try {
		window.dispatchEvent(new Event("markets_updated"));
	} catch {}
}
