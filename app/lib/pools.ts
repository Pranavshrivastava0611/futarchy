
export type Pool = {
	id: string;
	marketId: string;
	yesToken: string;
	noToken: string;
	yesReserve: number;
	noReserve: number;
	totalLiquidity: number;
	creator: string;
	createdAt: number;
	price: number; // Current YES price (0-1)
};

export type PoolTransaction = {
	id: string;
	poolId: string;
	type: "add_liquidity" | "remove_liquidity" | "swap_yes" | "swap_no";
	amount: number;
	user: string;
	timestamp: number;
};

// Constant Product AMM (x * y = k)
export class AMMPool {
	constructor(
		public yesReserve: number,
		public noReserve: number,
		public feeRate: number = 0.003 // 0.3% fee
	) {}

	// Get current YES token price (0-1)
	getYesPrice(): number {
		return this.noReserve / (this.yesReserve + this.noReserve);
	}

	// Get current NO token price (0-1)
	getNoPrice(): number {
		return this.yesReserve / (this.yesReserve + this.noReserve);
	}

	// Calculate output amount for swapping YES tokens
	swapYesAmount(yesInput: number): number {
		const fee = yesInput * this.feeRate;
		const yesAfterFee = yesInput - fee;
		const newYesReserve = this.yesReserve + yesAfterFee;
		const newNoReserve = (this.yesReserve * this.noReserve) / newYesReserve;
		return this.noReserve - newNoReserve;
	}

	// Calculate output amount for swapping NO tokens
	swapNoAmount(noInput: number): number {
		const fee = noInput * this.feeRate;
		const noAfterFee = noInput - fee;
		const newNoReserve = this.noReserve + noAfterFee;
		const newYesReserve = (this.yesReserve * this.noReserve) / newNoReserve;
		return this.yesReserve - newYesReserve;
	}

	// Calculate liquidity tokens to mint when adding liquidity
	addLiquidity(yesAmount: number, noAmount: number): number {
		if (this.yesReserve === 0 && this.noReserve === 0) {
			// Initial liquidity
			return Math.sqrt(yesAmount * noAmount);
		}
		
		const yesRatio = yesAmount / this.yesReserve;
		const noRatio = noAmount / this.noReserve;
		const minRatio = Math.min(yesRatio, noRatio);
		
		return minRatio * Math.sqrt(this.yesReserve * this.noReserve);
	}

	// Calculate token amounts when removing liquidity
	removeLiquidity(liquidityTokens: number): { yesAmount: number; noAmount: number } {
		const totalLiquidity = Math.sqrt(this.yesReserve * this.noReserve);
		const ratio = liquidityTokens / totalLiquidity;
		
		return {
			yesAmount: ratio * this.yesReserve,
			noAmount: ratio * this.noReserve
		};
	}

	// Update reserves after a transaction
	updateReserves(yesDelta: number, noDelta: number): void {
		this.yesReserve += yesDelta;
		this.noReserve += noDelta;
	}
}

// Local storage helpers
const STORAGE_KEY = "futarchy_pools_v1";
const TX_STORAGE_KEY = "futarchy_pool_txs_v1";

export function loadPools(): Pool[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Pool[]) : [];
	} catch {
		return [];
	}
}

export function savePool(pool: Pool): void {
	if (typeof window === "undefined") return;
	const current = loadPools();
	const updated = [pool, ...current.filter(p => p.id !== pool.id)];
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}


export function loadPoolTransactions(): PoolTransaction[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(TX_STORAGE_KEY);
		return raw ? (JSON.parse(raw) as PoolTransaction[]) : [];
	} catch {
		return [];
	}
}

export function savePoolTransaction(tx: PoolTransaction): void {
	if (typeof window === "undefined") return;
	const current = loadPoolTransactions();
	const updated = [tx, ...current];
	window.localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(updated));
}

// Pool factory function
export function createPool(
	marketId: string,
	yesToken: string,
	noToken: string,
	initialYesAmount: number,
	initialNoAmount: number,
	creator: string
): Pool {
	const poolId = `${marketId}_${Date.now()}`;
	const amm = new AMMPool(initialYesAmount, initialNoAmount);
	
	const pool: Pool = {
		id: poolId,
		marketId,
		yesToken,
		noToken,
		yesReserve: initialYesAmount,
		noReserve: initialNoAmount,
		totalLiquidity: amm.addLiquidity(initialYesAmount, initialNoAmount),
		creator,
		createdAt: Date.now(),
		price: amm.getYesPrice()
	};

	return pool;
}
