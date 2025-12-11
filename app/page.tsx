"use client";

import Link from "next/link";
import { useState } from "react";
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Header } from "./components/Header";

const GOVERNMENT_FACTS = [
  {
    model: "Traditional Government",
    data: [
      { metric: "Decision Speed", value: 2 },
      { metric: "Participation", value: 3 },
      { metric: "Accuracy", value: 2 },
      { metric: "Incentive Alignment", value: 1 },
      { metric: "Transparency", value: 3 },
    ],
    color: "#6366f1"
  },
  {
    model: "DeFutarchy",
    data: [
      { metric: "Decision Speed", value: 8 },
      { metric: "Participation", value: 9 },
      { metric: "Accuracy", value: 8 },
      { metric: "Incentive Alignment", value: 9 },
      { metric: "Transparency", value: 8 },
    ],
    color: "#dd6bfa"
  }
];

export default function LandingPage() {
  const [modelIdx, setModelIdx] = useState(1);
  const facts = GOVERNMENT_FACTS[modelIdx];

  // Interactive simulation - market price impact
  const [belief, setBelief] = useState(60); // user input: percent yes
  const oldPrice = 55;
  const impactStrength = 0.2;
  const newPrice = Math.round((oldPrice * (1 - impactStrength)) + (belief * impactStrength));

  return (
    <div className="min-h-screen w-full text-white relative overflow-x-hidden"
      style={{
        background:
          `radial-gradient(1200px 600px at 50% -200px, rgba(120,119,198,0.23), transparent),
           radial-gradient(800px 400px at 120% -200px,rgba(236,72,153,0.16),transparent),
           radial-gradient(800px 400px at -20% -200px,rgba(99,102,241,0.10),transparent),
           repeating-linear-gradient(0deg, rgba(143,139,236,0.12), rgba(143,139,236,0.12) 1px, transparent 1px, transparent 40px),
           repeating-linear-gradient(90deg, rgba(143,139,236,0.12), rgba(143,139,236,0.12) 1px, transparent 1px, transparent 40px)`
      }}
    >
      <Header />
      {/* Gradient spotlight behind hero */}
      <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-gradient-to-br from-indigo-900 via-purple-800/80 to-pink-600/60 blur-3xl opacity-80 pointer-events-none" />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 relative z-10">
        <div className="mb-7 flex justify-center">
          <span className="bg-white/10 inline-flex items-center gap-2 rounded-xl px-5 py-2 text-purple-200 font-semibold text-base shadow">● Live on Solana Devnet</span>
        </div>
        <h1 className="relative text-[2.75rem] md:text-6xl font-black leading-tight mb-3 z-10">
          Governing by Markets
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-4">
          Smarter, Faster, and Truly Decentralized
        </h2>
        <p className="text-white/90 text-lg md:text-xl mb-9 max-w-2xl mx-auto relative z-10">
          DeFutarchy lets communities and users decide together—by trading on public markets about outcomes instead of only voting. Every trade is a signal. Prices become policy. This is decentralized, open governance, powered by collective wisdom and incentives, on Solana.
        </p>
        <Link href="/markets" className="relative z-10">
          <button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-pink-500 px-10 py-4 rounded-2xl text-xl font-bold shadow-lg transition-all">
            Start Trading <span className="ml-2">→</span>
          </button>
        </Link>
        {/* Interactive Comparative Chart Section */}
        <section className="mt-14 mb-8 w-full max-w-2xl mx-auto px-4">
          <div className="flex justify-center gap-3 mb-4">
            {GOVERNMENT_FACTS.map((g, i) => (
              <button
                key={g.model}
                onClick={() => setModelIdx(i)}
                className={`px-5 py-2 rounded-full transition font-semibold border border-white/10 backdrop-blur-xl focus:outline-none focus:ring-2 ${modelIdx === i ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" : "bg-black/30 text-purple-200 hover:bg-white/10"}`}
              >
                {g.model}
              </button>
            ))}
          </div>
          <div className="rounded-2xl bg-black/40 border border-purple-400/10 p-6 shadow-xl">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={facts.data} layout="vertical" barCategoryGap={32}>
                <XAxis type="number" domain={[0,10]} hide />
                <YAxis type="category" dataKey="metric" tick={{fill: '#ddd', fontWeight:'bold', fontSize:16}} width={140} />
                <Tooltip cursor={{fill:"#c4b5fd22"}} contentStyle={{background:"#292262", color:"#fff"}} />
                <Bar dataKey="value" radius={16} fill={facts.color} isAnimationActive >
                  <LabelList dataKey="value" position="right" fill="#fff" fontWeight={600}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-purple-100 text-center text-base md:text-lg">
              {modelIdx === 0 ?
                "Traditional governments rely on representation & slow voting. Participation is limited & incentives may not align with public good."
                :
                "DeFutarchy leverages market signals for speed, accuracy, transparency, and broader participation—incentivizing honest governance."
              }
            </div>
          </div>
        </section>
        {/* New Interactive Market Impact Demo Section */}
        <section className="my-14 w-full max-w-xl mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-br from-black/50 via-purple-800/80 to-indigo-900/70 border border-purple-300/20 shadow-xl p-7">
            <h3 className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-300 text-transparent bg-clip-text">Try Market Signaling!</h3>
            <p className="mb-4 text-white/80">Move the slider to set your belief in a YES outcome. See how your trade shifts the market prediction! In futarchy, everyone can impact the evolving signal.</p>
            <div className="flex items-center gap-2 justify-between">
              <span className="text-purple-300 text-base">0%</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={belief}
                onChange={e => setBelief(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg accent-purple-400 cursor-pointer bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                style={{background: "linear-gradient(to right,#818cf8 0%,#a21caf 70%,#f472b6 100%)"}}
              />
              <span className="text-pink-300 text-base">100%</span>
            </div>
            <div className="flex justify-between gap-5 mt-4 text-sm">
              <div className="flex-1 text-center">
                <div className="font-semibold text-purple-100">Old Market</div>
                <div className="text-2xl font-bold text-indigo-400">{oldPrice}%</div>
              </div>
              <div className="flex flex-col items-center relative">
                <div className="h-10 w-1 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
                <span className="text-xs text-purple-100 mt-1">Your trade</span>
              </div>
              <div className="flex-1 text-center">
                <div className="font-semibold text-pink-100">Market After</div>
                <div className="text-2xl font-bold text-pink-400 transition-all">{newPrice}%</div>
              </div>
            </div>
            <div className="mt-2 text-purple-200 text-sm text-center">
              In DeFutarchy, every trade changes the signal. The more conviction you have, the more you move the crowd consensus.
            </div>
          </div>
        </section>
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-10"></div>
      </main>
    </div>
  );
}
