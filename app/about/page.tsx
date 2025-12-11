"use client"
import { useState } from "react";
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Header } from "../components/Header";

const ABOUT_METRICS = [
  {
    model: "Traditional Government",
    data: [
      { metric: "Decision Speed", value: 2 },
      { metric: "Participation", value: 3 },
      { metric: "Incentives", value: 2 },
      { metric: "Decentralization", value: 1 },
      { metric: "Openness", value: 2 },
      { metric: "Transparency", value: 3 },
    ],
    color: "#6366f1"
  },
  {
    model: "DeFutarchy",
    data: [
      { metric: "Decision Speed", value: 8 },
      { metric: "Participation", value: 9 },
      { metric: "Incentives", value: 9 },
      { metric: "Decentralization", value: 9 },
      { metric: "Openness", value: 8 },
      { metric: "Transparency", value: 8 },
    ],
    color: "#dd6bfa"
  }
];

export default function AboutPage() {
  const [modelIdx, setModelIdx] = useState(1);
  const facts = ABOUT_METRICS[modelIdx];

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
      <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-8">
        <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-2xl w-full mt-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">About DeFutarchy</h1>
          <p className="text-white/70 mb-6">
            DeFutarchy is an experimental governance dApp on Solana Devnet. It empowers communities to create binary questions about strategic decisions, funding initiatives, or policies.
          </p>
          <p className="text-white/70 mb-6">
            For every question, YES/NO tokens are minted, and liquidity is provided to a decentralized market. Users can trade these tokens, signaling their true beliefs about which outcome improves a key metric. Token prices provide collective intelligence that guides decisions. Governance by markets—built on transparency, accountability, and decentralized finance.
          </p>
          <p className="text-white/60 text-sm">
            Note: This is a demo on Solana Devnet. No real money or assets are at risk.
          </p>
        </div>
        {/* Interactive Comparative Chart Section */}
        <section className="mt-0 mb-10 w-full max-w-2xl mx-auto px-4">
          <div className="flex justify-center gap-3 mb-4">
            {ABOUT_METRICS.map((g, i) => (
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
            <ResponsiveContainer width="100%" height={315}>
              <BarChart data={facts.data} layout="vertical" barCategoryGap={26}>
                <XAxis type="number" domain={[0,10]} hide />
                <YAxis type="category" dataKey="metric" tick={{fill: '#ddd', fontWeight:'bold', fontSize:16}} width={158} />
                <Tooltip cursor={{fill:"#c4b5fd22"}} contentStyle={{background:"#292262", color:"#fff"}} />
                <Bar dataKey="value" radius={16} fill={facts.color} isAnimationActive >
                  <LabelList dataKey="value" position="right" fill="#fff" fontWeight={600}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-purple-100 text-center text-base md:text-lg">
              {modelIdx === 0 ?
                "Traditional governments limit participation and are slow to change. Incentives are indirect, and openness is often limited."
                :
                "DeFutarchy is decentralized, participatory, financially aligned—and open to all. Governance becomes an honest, transparent market."}
            </div>
          </div>
        </section>
        <section className="my-8 max-w-2xl mx-auto w-full">
          <div className="rounded-3xl bg-gradient-to-br from-purple-900/80 via-indigo-800/90 to-pink-700/60 p-7 border border-purple-400/20 shadow-xl mb-12">
            <h3 className="text-2xl font-bold mb-4 text-purple-200">Which Governance System Fits You?</h3>
            <AboutQuiz />
          </div>
          <div className="rounded-3xl bg-black/60 p-5 border border-purple-700/30 shadow-lg mb-4">
            <h3 className="text-xl font-bold mb-2 text-purple-200">FAQ: DeFutarchy, Decentralization, and Markets</h3>
            <AboutFAQ />
          </div>
        </section>
      </main>
    </div>
  );
}

const quizQs = [
  {q: 'How should communities make big decisions?',
    a: ["Elected leaders decide", "Everyone votes", "Let the market decide", "Votes & markets both"]},
  {q: 'Do you trust crowds with incentives more than politicians?',
    a: ["Not at all", "A little", "A lot!", "Inbetween"]},
  {q: 'What’s most important?',
    a: ["Stability", "Speed", "Wisdom", "Openness"]}
];
const resMap = [
  {label: "Traditional", border:'border-indigo-400', text:'You like stable, representative systems. You lean toward a classic democracy or republic.'},
  {label: "DeFutarchy",border:'border-pink-400', text:'You believe in crowd wisdom and incentives! DeFutarchy is for you—where markets speak.'},
  {label: "DAO",border:'border-purple-400', text:'You prefer open, direct, on-chain control by everyone. DAOs are your style.'},
  {label: "Hybrid",border:'border-blue-400',text:'You like mixing both. Maybe a hybrid (token-voting + market) works for your ideal world!'}
];
function AboutQuiz() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState<number[]>([]);
  if (step === quizQs.length) {
    const tally = [0,0,0,0];
    score.forEach(n => tally[n]++);
    const best = tally.indexOf(Math.max(...tally));
    const res = resMap[best];
    return <div className={`mt-4 p-6 rounded-2xl border-2 ${res.border} bg-gradient-to-r from-black/50 to-purple-900/40 animate-fadeIn`}> <div className="text-xl font-bold mb-2">Result: {res.label}</div><div>{res.text}</div><button className="mt-4 px-4 py-2 rounded-xl border border-purple-500" onClick={()=>{setStep(0);setScore([]);}}>Try Again</button></div>
  }
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="text-lg md:text-xl mb-2"><span className="text-purple-100">Q{step+1}:</span> {quizQs[step].q}</div>
      <div className="flex flex-wrap gap-4 justify-center">
        {quizQs[step].a.map((ans,i)=>(<button key={ans} className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600/70 via-purple-700/70 to-pink-500/80 hover:scale-105 shadow text-white font-semibold" onClick={()=>{setScore([...score,i]);setStep(step+1);}}>{ans}</button>))}
      </div>
    </div>
  );
}
const faqs = [
  {q:'What is futarchy?',a:'A form of decision-making where prediction markets determine social choices.'},
  {q:'Do I need tokens to participate?',a:'Yes, YES/NO tokens let you signal your beliefs and vote via trading.'},
  {q:'Why is transparency better here?',a:'Market data and all trades are recorded on chain, for anyone to see.'},
  {q:'Can this replace government?',a:'Futarchy can complement or guide traditional government, not always replace it.'},
];
function AboutFAQ(){
  const [open,setOpen]=useState(-1);
  return (<ul className="space-y-2">
    {faqs.map((f,i)=>(<li key={f.q}>
      <button className="flex items-center w-full text-left gap-2 px-2 py-2 rounded-lg hover:bg-purple-900/50" onClick={()=>setOpen(open===i?-1:i)}>
        <span className="inline-block bg-purple-500/40 rounded-full w-6 h-6 text-center text-purple-100">{open===i?'🔽':'🔍'}</span>
        <span className="font-semibold text-purple-200 mr-2">{f.q}</span>
      </button>
      {open===i && <div className="ml-10 mt-1 text-purple-100 animate-fadeIn">{f.a}</div>}
    </li>))}
  </ul> );
}
