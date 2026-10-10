# THALSA — Ocean of Knowledge AI Engine

> **Multiple minds. One clear ocean of insight.**
> *Ask once. Get a smarter, grounded answer.*

THALSA (derived from *Thalassa* — the ancient ocean) is a high-performance, minimalist multi-model AI comparison and knowledge aggregation engine. It queries multiple state-of-the-art AI models simultaneously, compares their structured perspectives side-by-side, analyzes semantic consensus, and synthesizes a consolidated final take ("**THALSA'S TAKE**").

---

## 🎨 Visual Identity & Design System

The product aesthetic is inspired by high-end design languages such as Linear, Raycast, and modern Apple interfaces:

* **Primary Palette**: Sky Blue (`#7AA8C8`), Warm Gold (`#C8A45D`), Muted Bronze (`#A87B51`), Deep Charcoal/Black (`#0C0D0E`), Cream/Off-White (`#F3EFEA`).
* **Clean Typography**: Powered by `Geist` and `JetBrains Mono` for code blocks.
* **Subtle Motion**: Progressive step indicators, refined card hovering, smooth responsive layout.
* **Non-bloated**: Free of unnecessary neon glow, heavy glassmorphism, or intrusive AI particles.

---

## 🚀 Version Releases & Roadmap

### 📦 v1.0.0 (Current Release)
1. **One-Prompt Multi-Model Comparison**:
   - Query **Google (Gemini 1.5 Flash)**, **Groq (Llama 3.3 70B)**, **Cerebras (Llama 3.1 8B)**, **OpenAI (GPT-4o mini)**, and **Anthropic (Claude 3.5 Haiku)** concurrently.
2. **Student & Exam Assistant Engine**:
   - Tailored academic response modes: standard concept breakdown, 2-mark, 5-mark, and 8-mark structured exam preparation.
3. **Knowledge Retrieval Layer**:
   - Built-in multi-source knowledge integration via Wikipedia, Wikidata, StackExchange, and OpenAlex.
4. **THALSA'S TAKE**:
   - Automated intelligent synthesis highlighting consensus points, key differences, and the cleanest answer.
5. **Response Agreement Score**:
   - Transparent semantic overlap scoring across model outputs without falsely claiming factual ground truth.
6. **Built-in Local Database (SQLite)**:
   - Full history persistence with one-click reloading of past comparisons.

### 🌊 v2.0.0 (Ocean Layer & Public APIs Grounding)
1. **Public APIs Directory Hub**:
   - Curated directory of top, verified public APIs ingested from `public-apis/public-apis` across 10 categories (Weather, Finance, Games, Anime, Books, Development, News, Science, etc.).
   - Frontend Public APIs explorer with search, category filtering, HTTPS/CORS indicators, and direct docs links.
2. **Real-Time Live Ground Truth Dispatcher**:
   - **Meteorology & Forecast:** Real-time weather, temperature, humidity, and wind conditions via Open-Meteo Public API with preset global city coordinates.
   - **Financial & Crypto Markets:** Live spot cryptocurrency prices (Bitcoin, Ethereum, Solana, Doge) and global foreign exchange rates (USD, INR, EUR, GBP, JPY) via Coinbase & CoinGecko Public APIs.
   - **Tech & Engineering News:** Real-time trending headlines from HackerNews Firebase Public API.
   - **API Recommender Engine:** Intelligent discovery for developer questions (e.g., *"What public APIs exist for weather?"*).
3. **Transparent Public API Verification**:
   - All live facts cited with verified source URLs and integrated into Thalsa's answer synthesis.

---

## 🛠 Tech Stack

* **Frontend**: HTML5, CSS3 (Custom Design Tokens), JavaScript (ES6+), Marked.js.
* **Backend**: Node.js, Express.js.
* **Database**: SQLite (via `better-sqlite3` with WAL mode).
* **Architecture**: Pluggable provider architecture with multi-source knowledge coordinators.

---

## 📦 Getting Started

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* npm

### 2. Installation
```bash
# Clone or navigate to the repository
cd thalsa

# Install dependencies
npm install
```

### 3. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your optional API keys in `.env` (Gemini, Groq, Cerebras, OpenAI, Anthropic).  
*(Note: If no API keys are provided, THALSA runs out-of-the-box in mock/demo mode).*

### 4. Run THALSA
```bash
# Start server
npm start

# Or with automatic reload during development
npm run dev
```

Open your browser and visit:
```
http://localhost:3000
```

---

## 📂 Project Structure

```
thalsa/
├── public/
│   ├── css/
│   │   └── style.css          # Design system & mobile layout
│   ├── js/
│   │   └── app.js             # SPA router, comparison lifecycle, history
│   └── index.html             # Clean semantic HTML interface
├── server/
│   ├── db/
│   │   └── database.js        # SQLite persistence layer
│   ├── engine/
│   │   ├── LumiqOrchestrator.js # Query orchestration engine
│   │   └── StudentSynthesizer.js # Pedagogical answer synthesis
│   ├── knowledge/
│   │   ├── KnowledgeCoordinator.js # Multi-API knowledge dispatcher
│   │   ├── WikipediaProvider.js
│   │   ├── WikidataProvider.js
│   │   ├── StackExchangeProvider.js
│   │   └── OpenAlexProvider.js
│   ├── providers/
│   │   ├── BaseProvider.js    # Pluggable AI provider interface
│   │   ├── GoogleProvider.js
│   │   ├── GroqProvider.js
│   │   ├── CerebrasProvider.js
│   │   ├── OpenAIProvider.js
│   │   ├── AnthropicProvider.js
│   │   └── ProviderManager.js
│   └── index.js               # Express REST API routes & rate limiter
├── data/                      # (Ignored in Git) SQLite DB
├── .env.example
├── .gitignore
├── package.json
└── README.md
```
