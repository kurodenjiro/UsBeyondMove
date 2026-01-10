# BeyondUs: The AI-Native NFT Foundry on Movement

![BeyondUs](/logo.png)

**BeyondUs** is a next-generation NFT creation platform that democratizes onchain asset creation by merging advanced Generative AI with the high-throughput Movement Network. We allow anyone—regardless of artistic ability—to turn a single image or text prompt into a fully deployed, immutable NFT collection in minutes.

## 🚀 Features

- **AI-Powered Analysis**: Upload a single image, and our integration with **Google Gemini Vision** deconstructs it into traits and styles.
- **Generative Synthesis**: Create consistent variations and sprite sheets using custom diffusion pipelines.
- **Layer Editor**: Drag-and-drop interface to fine-tune assets and layers.
- **One-Click Minting**: Auto-deploy smart contracts and mint tokens directly to the **Movement Network**.
- **x402 Compliance**: Built-in "Pay-for-Compute" using the x402 standard to ensure sustainable AI usage.

## 🛠 Tech Stack

- **AI Layer**: Google Gemini 1.5 Pro Vision, Custom Diffusion Models.
- **Blockchain**: Movement Network (Aptos Move VM).
- **Authentication**: Privy (Embedded Wallets, Social Login).
- **Storage**: IPFS, Prisma/Postgres.
- **Framework**: Next.js 14, Tailwind CSS.

## 💰 Revenue Model

BeyondUs implements a circular economic model on the Movement blockchain:

1.  **"Pay-per-Forge"**: Micro-transactions (in MOVE) for AI generation, verifying payment via `X-Payment-Hash`.
2.  **Launchpad Fees**: 2.5% commission on primary sales of deployed collections.
3.  **Royalties**: 5% secondary sales royalty (split 4% Creator / 1% Protocol).
4.  **Enterprise SaaS**: Subscriptions for advanced tooling and white-glove support.

> *By enabling users to fund AI compute costs directly from NFT sale proceeds, we establish a circular economic model on the Movement blockchain.*

## 💳 Why x402?

- **Atomic Access**: Cryptographic proof of payment required for AI execution.
- **Sybil Resistance**: Cost-based protection against spam and bots.
- **Agentic Standards**: Ready for autonomous AI agents to negotiate resources.

## 🔐 Why Privy?

- **Invisible Web3**: Email/Social login for mass adoption.
- **Embedded Wallets**: Secure, self-custodial wallets automatically generated.
- **Seamless Signing**: No popup fatigue—keep users in the creative flow.

## 📦 Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/kurodenjiro/UsBeyondMove.git
    cd UsBeyondMove
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    ```bash
    cp .env.example .env
    # Fill in your GEMINI_API_KEY, PRIVY_APP_ID, etc.
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) to start forging!
