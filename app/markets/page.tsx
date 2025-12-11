"use client"

import { useState } from "react";
import { Header } from "../components/Header";
import { MarketList } from "../components/MarketList";

const SORT_OPTIONS = [
  { label: "Newest", key: "new" },
  { label: "Most Liquidity", key: "liq" },
  { label: "Trending", key: "trend" }
];

export default function MarketsPage() {
  const [sort, setSort] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
  
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
      <section className="w-full max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Markets</h2>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search Input */}
            <div className="flex-1 max-w-md w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markets by question..."
                className="w-full rounded-xl border border-white/10 bg-white/10 backdrop-blur-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-400/40 text-white placeholder:text-white/50"
              />
            </div>
            {/* Sort Buttons */}
            <div className="flex gap-2">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`px-4 py-2 rounded-full border border-white/10 font-semibold text-sm transition-all duration-200 ${
                    sort===opt.key 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105' 
                      : 'bg-black/30 text-purple-200 hover:bg-white/10 hover:scale-105'
                  }`}
                  onClick={()=>setSort(opt.key)}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>
        <MarketList sortKey={sort} searchQuery={searchQuery} />
      </section>
    </div>
  );
}
