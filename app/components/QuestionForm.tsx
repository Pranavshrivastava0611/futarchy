"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, SendTransactionError } from "@solana/web3.js";
import { useCallback, useState } from "react";
import { saveMarket } from "../lib/markets";
import { addLiquidityToRaydiumPool, createRaydiumLiquidityPool } from "../lib/raydium";
import { buildCreateMintTransaction, buildMintToTransaction } from "../lib/solana";

export function QuestionForm() {
	const [question, setQuestion] = useState("");
	const [loading, setLoading] = useState(false);
	const { connection } = useConnection();
	const { publicKey, signTransaction, sendTransaction } = useWallet();

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
			alert(`YES and NO tokens created with Raydium LP pool: ${poolResult.poolInfo.id}`);
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
		<section className="w-full max-w-3xl mx-auto">
			<div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
				<h2 className="text-lg font-medium mb-3">Create a question</h2>
				<div className="flex flex-col gap-3">
					<input
						value={question}
						onChange={(e) => setQuestion(e.target.value)}
						placeholder="Should we fund initiative X this quarter?"
						className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
					/>
					<div className="flex gap-3">
						<button onClick={onCreate} disabled={loading || !publicKey || !question.trim()} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white disabled:opacity-50">
							{loading ? "Creating..." : "Launch YES/NO tokens"}
						</button>
						<button className="px-4 py-2 rounded-xl border border-white/10 text-white/80" disabled>
							Open market (soon)
						</button>
					</div>
					<p className="text-xs text-white/60">Tokens will be minted on Solana devnet.</p>
				</div>
			</div>
		</section>
	);
}
