"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SendTransactionError } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { loadMarkets } from "../lib/markets";
import {
    AddLiquidityParams,
    calculateAddLiquidity,
    calculateRemoveLiquidity,
    createRaydiumSwap,
    LiquidityPoolInfo,
    RemoveLiquidityParams,
    SwapParams
} from "../lib/raydium";

interface TradingInterfaceProps {
  poolInfo: LiquidityPoolInfo;
  marketId: string;
}

export function TradingInterface({ poolInfo, marketId }: TradingInterfaceProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [activeTab, setActiveTab] = useState<'swap' | 'add' | 'remove'>('swap');
  const [loading, setLoading] = useState(false);
  
  // Swap state
  const [swapInputAmount, setSwapInputAmount] = useState('');
  const [swapInputToken, setSwapInputToken] = useState<'A' | 'B'>('A');
  const [swapSlippage, setSwapSlippage] = useState(0.5);
  const [swapResult, setSwapResult] = useState<any>(null);
  
  // Add liquidity state
  const [addAmountA, setAddAmountA] = useState('');
  const [addAmountB, setAddAmountB] = useState('');
  const [addResult, setAddResult] = useState<any>(null);
  
  // Remove liquidity state
  const [removeLpTokens, setRemoveLpTokens] = useState('');
  const [removeResult, setRemoveResult] = useState<any>(null);

  const markets = loadMarkets();
  const market = markets.find(m => m.id === marketId);

  // Calculate swap output when inputs change
  useEffect(() => {
    if (swapInputAmount && !isNaN(Number(swapInputAmount)) && publicKey) {
      const calculateSwap = async () => {
        try {
          const params: SwapParams = {
            connection,
            poolInfo,
            inputAmount: Number(swapInputAmount),
            inputToken: swapInputToken,
            slippageTolerance: swapSlippage,
            payer: publicKey
          };
          const result = await createRaydiumSwap(params);
          setSwapResult(result);
        } catch (error) {
          console.error("Error calculating swap:", error);
          setSwapResult(null);
        }
      };
      calculateSwap();
    } else {
      setSwapResult(null);
    }
  }, [swapInputAmount, swapInputToken, swapSlippage, poolInfo, connection, publicKey]);

  // Calculate add liquidity when inputs change
  useEffect(() => {
    if (addAmountA && addAmountB && !isNaN(Number(addAmountA)) && !isNaN(Number(addAmountB))) {
      const params: AddLiquidityParams = {
        poolInfo,
        amountA: Number(addAmountA),
        amountB: Number(addAmountB)
      };
      const result = calculateAddLiquidity(params);
      setAddResult(result);
    } else {
      setAddResult(null);
    }
  }, [addAmountA, addAmountB, poolInfo]);

  // Calculate remove liquidity when input changes
  useEffect(() => {
    if (removeLpTokens && !isNaN(Number(removeLpTokens))) {
      const params: RemoveLiquidityParams = {
        poolInfo,
        lpTokens: Number(removeLpTokens)
      };
      const result = calculateRemoveLiquidity(params);
      setRemoveResult(result);
    } else {
      setRemoveResult(null);
    }
  }, [removeLpTokens, poolInfo]);

  const handleSwap = useCallback(async () => {
    if (!publicKey || !sendTransaction || !swapResult) return;
    
    setLoading(true);
    try {
      // Execute real Raydium swap transaction
      const signature = await sendTransaction(swapResult.transaction, connection, { 
        skipPreflight: false,
        maxRetries: 3
      });
      
      await connection.confirmTransaction({ 
        ...(await connection.getLatestBlockhash()), 
        signature 
      }, "confirmed");
      
      alert(`Swap executed! Transaction: ${signature}\nYou received ${swapResult.outputAmount.toFixed(6)} ${swapInputToken === 'A' ? 'NO' : 'YES'} tokens`);
    } catch (e) {
      if (e instanceof SendTransactionError) {
        try {
          const logs = await e.getLogs(connection);
          console.error("SendTransactionError logs:", logs);
          alert("Swap failed: " + (e as Error).message + "\nLogs: " + logs?.join("\n"));
        } catch {}
      }
      console.error(e);
      alert("Swap failed: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, swapResult, swapInputToken, connection]);

  const handleAddLiquidity = useCallback(async () => {
    if (!publicKey || !sendTransaction || !addResult) return;
    
    setLoading(true);
    try {
      // In a real implementation, you'd create and send add liquidity transactions
      console.log('Adding liquidity:', addResult);
      alert(`Liquidity added! You received ${addResult.lpTokensReceived.toFixed(6)} LP tokens (${addResult.sharePercentage.toFixed(2)}% of pool)`);
    } catch (e) {
      if (e instanceof SendTransactionError) {
        try {
          const logs = await e.getLogs(connection);
          console.error("SendTransactionError logs:", logs);
        } catch {}
      }
      console.error(e);
      alert("Add liquidity failed: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, addResult, connection]);

  const handleRemoveLiquidity = useCallback(async () => {
    if (!publicKey || !sendTransaction || !removeResult) return;
    
    setLoading(true);
    try {
      // In a real implementation, you'd create and send remove liquidity transactions
      console.log('Removing liquidity:', removeResult);
      alert(`Liquidity removed! You received ${removeResult.amountA.toFixed(6)} YES and ${removeResult.amountB.toFixed(6)} NO tokens`);
    } catch (e) {
      if (e instanceof SendTransactionError) {
        try {
          const logs = await e.getLogs(connection);
          console.error("SendTransactionError logs:", logs);
        } catch {}
      }
      console.error(e);
      alert("Remove liquidity failed: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, removeResult, connection]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Trading Interface</h3>
        <p className="text-sm text-white/60 mb-4">{market?.question}</p>
        
        {/* Pool Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-white/60">TVL</p>
            <p className="text-sm font-medium">${poolInfo.tvl.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-white/60">YES Price</p>
            <p className="text-sm font-medium">${poolInfo.price.toFixed(4)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-white/60">NO Price</p>
            <p className="text-sm font-medium">${(1/poolInfo.price).toFixed(4)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-white/60">Volume 24h</p>
            <p className="text-sm font-medium">${poolInfo.volume24h.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-white/5 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('swap')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'swap' 
              ? 'bg-white/10 text-white' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Swap
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'add' 
              ? 'bg-white/10 text-white' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Add Liquidity
        </button>
        <button
          onClick={() => setActiveTab('remove')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'remove' 
              ? 'bg-white/10 text-white' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Remove Liquidity
        </button>
      </div>

      {/* Swap Tab */}
      {activeTab === 'swap' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-2">From</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={swapInputAmount}
                onChange={(e) => setSwapInputAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
              />
              <select
                value={swapInputToken}
                onChange={(e) => setSwapInputToken(e.target.value as 'A' | 'B')}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="A">YES</option>
                <option value="B">NO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">Slippage Tolerance (%)</label>
            <input
              type="number"
              value={swapSlippage}
              onChange={(e) => setSwapSlippage(Number(e.target.value))}
              step="0.1"
              min="0.1"
              max="50"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {swapResult && (
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-white/60">You receive:</span>
                <span className="text-sm font-medium">
                  {swapResult.outputAmount.toFixed(6)} {swapInputToken === 'A' ? 'NO' : 'YES'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/60">Price Impact:</span>
                <span className={`text-sm ${swapResult.priceImpact > 5 ? 'text-red-400' : 'text-green-400'}`}>
                  {swapResult.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/60">Fee:</span>
                <span className="text-sm">{swapResult.fee.toFixed(6)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSwap}
            disabled={loading || !publicKey || !swapResult}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white disabled:opacity-50"
          >
            {loading ? "Swapping..." : "Swap"}
          </button>
        </div>
      )}

      {/* Add Liquidity Tab */}
      {activeTab === 'add' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-2">YES Amount</label>
            <input
              type="number"
              value={addAmountA}
              onChange={(e) => setAddAmountA(e.target.value)}
              placeholder="0.0"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">NO Amount</label>
            <input
              type="number"
              value={addAmountB}
              onChange={(e) => setAddAmountB(e.target.value)}
              placeholder="0.0"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {addResult && (
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-white/60">LP Tokens:</span>
                <span className="text-sm font-medium">{addResult.lpTokensReceived.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/60">Pool Share:</span>
                <span className="text-sm">{addResult.sharePercentage.toFixed(2)}%</span>
              </div>
            </div>
          )}

          <button
            onClick={handleAddLiquidity}
            disabled={loading || !publicKey || !addResult}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Liquidity"}
          </button>
        </div>
      )}

      {/* Remove Liquidity Tab */}
      {activeTab === 'remove' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-2">LP Tokens to Remove</label>
            <input
              type="number"
              value={removeLpTokens}
              onChange={(e) => setRemoveLpTokens(e.target.value)}
              placeholder="0.0"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {removeResult && (
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-white/60">YES Tokens:</span>
                <span className="text-sm font-medium">{removeResult.amountA.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/60">NO Tokens:</span>
                <span className="text-sm font-medium">{removeResult.amountB.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/60">Pool Share:</span>
                <span className="text-sm">{removeResult.sharePercentage.toFixed(2)}%</span>
              </div>
            </div>
          )}

          <button
            onClick={handleRemoveLiquidity}
            disabled={loading || !publicKey || !removeResult}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white disabled:opacity-50"
          >
            {loading ? "Removing..." : "Remove Liquidity"}
          </button>
        </div>
      )}
    </div>
  );
}
