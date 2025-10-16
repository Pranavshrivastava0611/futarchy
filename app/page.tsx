"use client";

import { Header } from "./components/Header";
import { MarketList } from "./components/MarketList";
import { QuestionForm } from "./components/QuestionForm";

export default function Home() {
	return (
		<div className="min-h-screen w-full text-white bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(120,119,198,0.25),transparent),radial-gradient(800px_400px_at_120%_-200px,rgba(236,72,153,0.18),transparent),radial-gradient(800px_400px_at_-20%_-200px,rgba(99,102,241,0.12),transparent)]">
			<Header />

			<section className="w-full max-w-6xl mx-auto px-6 py-10">
				<div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
					<h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Governing by markets</h1>
					<p className="mt-3 text-white/70 max-w-2xl">Create binary questions that mint YES/NO tokens on Solana devnet. Prices inform decisions—the market says which policy improves the metric.</p>
					<div className="mt-6 flex gap-4">
						<a href="#create" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500">Create question</a>
						<a href="#markets" className="px-5 py-2.5 rounded-xl border border-white/10">View markets</a>
					</div>
				</div>
			</section>

			<div id="create" className="px-6 py-6">
				<QuestionForm />
			</div>

			<div id="markets" className="px-6 py-6">
				<MarketList />
			</div>
		</div>
	);
}
