import { MINT_SIZE, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction, getAssociatedTokenAddress, getMinimumBalanceForRentExemptMint } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

export type CreatedMint = {
	mintAddress: string;
	associatedTokenAddress: string;
};

export async function buildCreateMintTransaction(params: {
	connection: Connection;
	payer: PublicKey;
	mintAuthority: PublicKey;
	decimals?: number;
}): Promise<{ transaction: Transaction; mintKeypair: Keypair; associatedTokenAddress: PublicKey }> {
	const { connection, payer, mintAuthority, decimals = 6 } = params;

	const mintKeypair = Keypair.generate();
	const lamportsForMint = await getMinimumBalanceForRentExemptMint(connection);

	const createMintAccountIx = SystemProgram.createAccount({
		fromPubkey: payer,
		newAccountPubkey: mintKeypair.publicKey,
		space: MINT_SIZE,
		lamports: lamportsForMint,
		programId: TOKEN_PROGRAM_ID,
	});

	const initMintIx = createInitializeMintInstruction(
		mintKeypair.publicKey,
		number(decimals),
		mintAuthority,
		null,
		TOKEN_PROGRAM_ID
	);

	const ata = await getAssociatedTokenAddress(mintKeypair.publicKey, payer);
	const createAtaIx = createAssociatedTokenAccountInstruction(
		payer,
		ata,
		payer,
		mintKeypair.publicKey
	);

	const tx = new Transaction().add(createMintAccountIx, initMintIx, createAtaIx);
	return { transaction: tx, mintKeypair, associatedTokenAddress: ata };
}

export async function buildMintToTransaction(params: {
	mint: PublicKey;
	recipientAta: PublicKey;
	amount: bigint;
	payer: PublicKey;
}): Promise<Transaction> {
	const { mint, recipientAta, amount, payer } = params;
	const ix = createMintToInstruction(mint, recipientAta, payer, amount);
	return new Transaction().add(ix);
}

function number(n: number): number { return n; }
