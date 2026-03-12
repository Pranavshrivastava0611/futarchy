# DeFutarchy: Decentralized Governance by Markets

![Status](https://img.shields.io/badge/Status-Development_Phase-blue)
![Platform](https://img.shields.io/badge/Platform-Solana-purple)
![Frontend](https://img.shields.io/badge/Frontend-Next.js_15-black)

## 📌 Project Overview
**DeFutarchy** is a decentralized governance platform built on the Solana blockchain. It implements the concept of **Futarchy**, a governance model proposed by Robin Hanson where "values are voted on, but beliefs are traded on." 

Instead of traditional representative voting, DeFutarchy uses prediction markets to determine which policies will best achieve a community's stated goals. Markets become the "wisdom of the crowd" engine that drives organizational decision-making.

---

## 🏛️ The Futarchy Mechanism
Traditional governance often suffers from slow decision-making and misaligned incentives. DeFutarchy solves this by:
1. **Trading Outcomes**: Users buy and sell "YES" or "NO" tokens representing specific proposals.
2. **Price as Policy**: The market price reflects the collective belief in the proposal's success.
3. **Incentivized Accuracy**: Traders are financially motivated to provide accurate signals, as being wrong results in a loss of capital.

---

## 🚀 Key Features (Phase 1)
- **Interactive High-Performance Dashboard**: A sleek, Next.js 15 powered interface with glassmorphic aesthetics.
- **Real-Time Market Tracking**: Integrated price charts and sparklines using Recharts to visualize market sentiment.
- **Automated Market Maker (AMM)**: A simulated liquidity pool engine built on top of Solana accounts, mimicking Raydium-style swaps.
- **Market Creation Suite**: Ability for users to launch new markets with custom YES/NO token mints on the Solana Devnet.
- **Dynamic Simulations**: On-the-fly calculation of market impact and "belief signaling" sliders.

---

## 🛠️ Technical Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS.
- **Blockchain**: Solana Web3.js, SPL-Token.
- **Smart Contracts**: Anchor framework (Rust).
- **Visualization**: Recharts & Chart.js.
- **State Management**: Local persistence for market history & state syncing.

---

## 📂 Project Structure
```bash
├── app/
│   ├── components/      # Reusable UI components (Trading, Markets, Charts)
│   ├── lib/             # Core logic: Solana interactions, AMM simulations
│   ├── markets/         # Market discovery and filtering pages
│   ├── create/          # Market deployment interface
│   └── page.tsx         # Interactive landing page
├── programs/            # Rust smart contracts (Anchor)
├── public/              # Static assets and icons
└── Anchor.toml          # Solana deployment configuration
```

---

## 🗺️ Roadmap & Advanced Phase
- [ ] **AI Sentinel Integration**: LLM-powered market analysis to detect manipulation and provide sentiment summaries.
- [ ] **Persistent Global State**: Moving from localStorage to a Prisma/PostgreSQL backend for cross-user coordination.
- [ ] **Governance Bridge**: Automated execution of on-chain instructions (Squads/Realms) based on market resolution.
- [ ] **Order Book Implementation**: Moving beyond AMMs to limit order functionality for professional traders.

---

## 🔧 Getting Started
1. **Clone the repo**:
   ```bash
   git clone <repo-url>
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the dev server**:
   ```bash
   npm run dev
   ```
4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 👨‍💻 Project Team
- **College**: [Insert College Name]
- **Phase**: Governance Prototype & AMM Integration
- **Project Lead**: [Your Name/Team Name]
