"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, SendTransactionError } from "@solana/web3.js";
import { useCallback, useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { saveMarket } from "../lib/markets";
import { addLiquidityToRaydiumPool, createRaydiumLiquidityPool } from "../lib/raydium";
import { buildCreateMintTransaction, buildMintToTransaction } from "../lib/solana";
// --- Inline mock utility for chart ---
function getMockPriceHistory(seed: string | number) {
  const l = 16;
  let base = 0.5 + ((typeof seed === 'string' ? seed.length : seed % 10) - 5) / 25;
  return Array.from({ length: l }, (_, i) => ({
    time: i,
    price: Number((base + Math.sin(i * 0.4) * 0.09 + ((i % 3) - 1) * 0.014).toFixed(3))
  }));
}
export function QuestionForm() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  // Binary question validation
  const isGoodQuestion = /\b(should|will|can|is|does|could)\b.*\?/i.test(question) && question.length>8;
  const previewTokenSeed = question || "demo-seed";
  // ---
  const onCreate = useCallback(async () => {
    if (!publicKey || !signTransaction || !question.trim()) return;
    setLoading(true);
    try {
      // Create YES mint
      const yes = await buildCreateMintTransaction({
        connection: connection as Connection,
        payer: publicKey,
        mintAuthority: publicKey,
      });
      let tx1 = yes.transaction;
      tx1.feePayer = publicKey;
      tx1.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx1.partialSign(yes.mintKeypair);
      const sig1 = await sendTransaction(tx1, connection, { skipPreflight: false });
      await connection.confirmTransaction({ ...(await connection.getLatestBlockhash()), signature: sig1 }, "confirmed");

      // Mint initial liquidity to creator (optional small seed)
      let tx1b = await buildMintToTransaction({
        mint: yes.mintKeypair.publicKey,
        recipientAta: yes.associatedTokenAddress,
        amount: BigInt(100_0000_00), // 1.0 with 6 decimals
        payer: publicKey,
      });
      tx1b.feePayer = publicKey;
      tx1b.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const sig1b = await sendTransaction(tx1b, connection, { skipPreflight: false });
      await connection.confirmTransaction({ ...(await connection.getLatestBlockhash()), signature: sig1b }, "confirmed");

      // Create NO mint
      const no = await buildCreateMintTransaction({
        connection: connection as Connection,
        payer: publicKey,
        mintAuthority: publicKey,
      });
      let tx2 = no.transaction;
      tx2.feePayer = publicKey;
      tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx2.partialSign(no.mintKeypair);
      const sig2 = await sendTransaction(tx2, connection, { skipPreflight: false });
      await connection.confirmTransaction({ ...(await connection.getLatestBlockhash()), signature: sig2 }, "confirmed");

      let tx2b = await buildMintToTransaction({
        mint: no.mintKeypair.publicKey,
        recipientAta: no.associatedTokenAddress,
        amount: BigInt(100_0000),
        payer: publicKey,
      });
      tx2b.feePayer = publicKey;
      tx2b.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const sig2b = await sendTransaction(tx2b, connection, { skipPreflight: false });
      await connection.confirmTransaction({ ...(await connection.getLatestBlockhash()), signature: sig2b }, "confirmed");

      // Create Raydium liquidity pool for YES/NO tokens
      const poolResult = await createRaydiumLiquidityPool({
        connection: connection as Connection,
        payer: publicKey,
        tokenA: yes.mintKeypair.publicKey,
        tokenB: no.mintKeypair.publicKey,
        amountA: BigInt(100_0000_00), // 1.0 YES tokens
        amountB: BigInt(100_0000_00), // 1.0 NO tokens
      });

      // Add initial liquidity to the pool
      const addLiquidityTx = await addLiquidityToRaydiumPool({
        connection: connection as Connection,
        payer: publicKey,
        poolInfo: poolResult.poolInfo,
        tokenA: yes.mintKeypair.publicKey,
        tokenB: no.mintKeypair.publicKey,
        amountA: BigInt(100_0000_00),
        amountB: BigInt(100_0000_00),
      });

      const sigLiquidity = await sendTransaction(addLiquidityTx, connection, { skipPreflight: false });
      await connection.confirmTransaction({ ...(await connection.getLatestBlockhash()), signature: sigLiquidity }, "confirmed");

			// Initialize pool state with real initial reserves
			const { initializePoolState } = await import("../lib/poolState");
			initializePoolState(
				poolResult.poolInfo.id,
				poolResult.poolInfo.baseReserveNumber,
				poolResult.poolInfo.quoteReserveNumber
			);
			
			// Save market locally with pool info
			saveMarket({
				id: `${Date.now()}`,
				question: question.trim(),
				yesMint: yes.mintKeypair.publicKey.toBase58(),
				noMint: no.mintKeypair.publicKey.toBase58(),
				creator: publicKey.toBase58(),
				createdAt: Date.now(),
				poolId: poolResult.poolInfo.id,
				lpMint: poolResult.poolInfo.lpMint,
			});

      setQuestion("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4500);
    } catch (e) {
      if (e instanceof SendTransactionError) {
        try {
          const logs = await e.getLogs(connection as Connection);
          console.error("SendTransactionError logs:", logs);
        } catch {}
      }
      console.error(e);
      alert("Failed to create mints: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, question, connection]);

  return (
    <section className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 items-start w-full">
        {/* Left: Form */}
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg p-6 shadow-md min-w-0">
          <h2 className="text-lg font-medium mb-3">Create a question 
            <span className="ml-1 align-middle group relative">
              <span className="text-purple-300 cursor-help">&#9432;</span>
              <span className="absolute left-7 z-20 top-1/2 w-52 text-xs bg-black/90 text-purple-100 rounded-xl p-3 font-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Your question should be answerable YES or NO<sup>*</sup> for easy market clarity.</span>
            </span>
          </h2>
          <div className="flex flex-col gap-3">
            <label className="font-medium text-white/80 mb-1">Proposal or Policy <span className="text-pink-200">*</span></label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Should the treasury fund project X next quarter?"
              className={`w-full rounded-xl border text-base bg-white/10 border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400/40 transition ${question && !isGoodQuestion ? 'border-red-400/70 bg-red-800/10' : ''}`}
              maxLength={100}
            />
            {!isGoodQuestion && question && (
              <span className="text-xs text-red-400">Try making your question a clear YES/NO and end with a question mark.</span>
            )}
            <div className="flex gap-3 mt-2">
              <button onClick={onCreate} disabled={loading || !publicKey || !question.trim() || !isGoodQuestion} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white disabled:opacity-50 font-semibold">
                {loading ? "Creating..." : "Launch YES/NO tokens"}
              </button>
            </div>
            <p className="text-xs text-white/60 mt-4">Tokens will be minted on Solana devnet. Make questions binary for community clarity!</p>
          </div>
        </div>
        {/* Right: Live Preview */}
        <div className="w-full md:w-80 min-w-0">
          <div className="rounded-2xl border border-purple-500/20 shadow-lg bg-gradient-to-br from-indigo-900/80 via-purple-800/70 to-pink-700/50 p-5 relative">
            <div className="text-xs text-purple-100 mb-2">Market Preview</div>
            <div className="font-semibold text-white mb-1 line-clamp-2 min-h-[44px]">{question || "Your question will appear here!"}</div>
            <div className="flex justify-between items-center my-4">
              <div className="flex flex-col gap-1">
                <span className="text-green-300 font-bold text-sm">YES</span>
                <span className="text-xs text-purple-100">0x{previewTokenSeed.slice(0, 7).padEnd(8,"0")}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-pink-300 font-bold text-sm">NO</span>
                <span className="text-xs text-purple-100">0x{previewTokenSeed.slice(-8).padStart(8,"0")}</span>
              </div>
            </div>
            {/* Animated chart */}
            <div className="w-full h-24">
              <ResponsiveContainer>
                <LineChart data={getMockPriceHistory(previewTokenSeed)} >
                  <Line type="monotone" dataKey="price" stroke="#a78bfa" dot={false} strokeWidth={2} isAnimationActive/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-purple-200 mt-2">Price is updated as users trade YES/NO!</div>
          </div>
        </div>
        {showSuccess && <div className="fixed left-1/2 top-[25%] -translate-x-1/2 z-50 flex flex-col items-center animate-fadeIn pointer-events-none">
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/90 to-pink-700/70 border border-purple-400/40 shadow-2xl px-10 py-7 text-center">
            <div className="text-4xl mb-3 animate-bounce">🎉</div>
            <div className="text-lg font-semibold mb-2 text-white drop-shadow">Market Created Successfully!</div>
            <div className="text-purple-200 text-sm">Your question and tokens are live.<br/>You can view and trade in the Markets section!</div>
          </div>
        </div>}
      </div>
    </section>
  );
}
