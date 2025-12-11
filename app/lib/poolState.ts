// Real-time pool state management with persistence
export interface PoolState {
  poolId: string;
  baseReserve: number;  // YES token reserve
  quoteReserve: number; // NO token reserve
  lpSupply: number;
  volume24h: number;
  fees24h: number;
  lastUpdated: number;
}

const POOL_STATE_KEY = 'futarchy_pool_states_v1';

export function getPoolState(poolId: string): PoolState | null {
  if (typeof window === 'undefined') return null;
  try {
    const all = JSON.parse(window.localStorage.getItem(POOL_STATE_KEY) || '{}');
    return all[poolId] || null;
  } catch {
    return null;
  }
}

export function savePoolState(state: PoolState): void {
  if (typeof window === 'undefined') return;
  try {
    const all = JSON.parse(window.localStorage.getItem(POOL_STATE_KEY) || '{}');
    all[state.poolId] = state;
    window.localStorage.setItem(POOL_STATE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('pool_state_updated'));
  } catch (e) {
    console.error('Error saving pool state:', e);
  }
}

export function initializePoolState(poolId: string, initialBaseReserve: number, initialQuoteReserve: number): PoolState {
  const existing = getPoolState(poolId);
  if (existing) return existing;
  
  const state: PoolState = {
    poolId,
    baseReserve: initialBaseReserve,
    quoteReserve: initialQuoteReserve,
    lpSupply: Math.sqrt(initialBaseReserve * initialQuoteReserve), // Constant product
    volume24h: 0,
    fees24h: 0,
    lastUpdated: Date.now(),
  };
  savePoolState(state);
  return state;
}

export function updatePoolAfterSwap(
  poolId: string,
  inputToken: 'A' | 'B',
  inputAmount: number,
  feeRate: number = 0.003
): { newState: PoolState; outputAmount: number; newPrice: number } {
  const state = getPoolState(poolId);
  if (!state) throw new Error(`Pool state not found for ${poolId}`);
  
  const fee = inputAmount * feeRate;
  const inputAfterFee = inputAmount - fee;
  
  let newBaseReserve: number;
  let newQuoteReserve: number;
  let outputAmount: number;
  
  if (inputToken === 'A') {
    // Swapping YES (A) for NO (B)
    newBaseReserve = state.baseReserve + inputAfterFee;
    newQuoteReserve = (state.baseReserve * state.quoteReserve) / newBaseReserve;
    outputAmount = state.quoteReserve - newQuoteReserve;
  } else {
    // Swapping NO (B) for YES (A)
    newQuoteReserve = state.quoteReserve + inputAfterFee;
    newBaseReserve = (state.baseReserve * state.quoteReserve) / newQuoteReserve;
    outputAmount = state.baseReserve - newBaseReserve;
  }
  
  const newPrice = newQuoteReserve / newBaseReserve; // YES price = NO per YES
  const newVolume24h = state.volume24h + inputAmount;
  const newFees24h = state.fees24h + fee;
  
  const newState: PoolState = {
    ...state,
    baseReserve: newBaseReserve,
    quoteReserve: newQuoteReserve,
    volume24h: newVolume24h,
    fees24h: newFees24h,
    lastUpdated: Date.now(),
  };
  
  savePoolState(newState);
  return { newState, outputAmount, newPrice };
}

export function updatePoolAfterAddLiquidity(
  poolId: string,
  amountA: number,
  amountB: number
): { newState: PoolState; lpTokensReceived: number } {
  const state = getPoolState(poolId);
  if (!state) throw new Error(`Pool state not found for ${poolId}`);
  
  const newBaseReserve = state.baseReserve + amountA;
  const newQuoteReserve = state.quoteReserve + amountB;
  
  // Calculate LP tokens based on proportional increase
  const baseRatio = amountA / state.baseReserve;
  const quoteRatio = amountB / state.quoteReserve;
  const avgRatio = (baseRatio + quoteRatio) / 2;
  const lpTokensReceived = state.lpSupply * avgRatio;
  
  const newState: PoolState = {
    ...state,
    baseReserve: newBaseReserve,
    quoteReserve: newQuoteReserve,
    lpSupply: state.lpSupply + lpTokensReceived,
    lastUpdated: Date.now(),
  };
  
  savePoolState(newState);
  return { newState, lpTokensReceived };
}

export function updatePoolAfterRemoveLiquidity(
  poolId: string,
  lpTokens: number
): { newState: PoolState; amountA: number; amountB: number } {
  const state = getPoolState(poolId);
  if (!state) throw new Error(`Pool state not found for ${poolId}`);
  
  const ratio = lpTokens / state.lpSupply;
  const amountA = state.baseReserve * ratio;
  const amountB = state.quoteReserve * ratio;
  
  const newState: PoolState = {
    ...state,
    baseReserve: state.baseReserve - amountA,
    quoteReserve: state.quoteReserve - amountB,
    lpSupply: state.lpSupply - lpTokens,
    lastUpdated: Date.now(),
  };
  
  savePoolState(newState);
  return { newState, amountA, amountB };
}

export function getPoolPrice(poolId: string): number {
  const state = getPoolState(poolId);
  if (!state) return 0.5; // Default price
  return state.quoteReserve / state.baseReserve; // YES price = NO per YES
}

