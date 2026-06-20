# TerraTrack 🌍

**Live Demo:** https://terratrack.vercel.app

AI-powered carbon footprint awareness platform that helps users track emissions, analyze environmental impact, and receive personalized sustainability recommendations using Gemini AI.

## Features

- 📊 **Carbon Calculator** — Track emissions across transport, electricity, food, shopping, and water
- 🤖 **AI Recommendations** — Personalized reduction plans powered by Google Gemini
- 💬 **AI Chatbot** — Ask sustainability questions and get instant answers
- 🎮 **Gamification** — Weekly challenges, points, levels, and achievements
- 📈 **Dashboard** — Interactive charts showing your footprint breakdown and trends
- 📄 **Reports** — Generate and download detailed sustainability reports

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS v4
- **AI:** Google Gemini API (`gemini-1.5-flash`)
- **Database:** Firebase Firestore (with localStorage fallback)
- **Testing:** Vitest + fast-check (property-based) + React Testing Library
- **Charts:** Chart.js + react-chartjs-2

## Getting Started

```bash
cd ecotrack-app
npm install
cp .env.example .env   # Add your Gemini API key
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_API_KEY=...       # Optional — uses localStorage without it
VITE_FIREBASE_PROJECT_ID=...
```

Get a free Gemini API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## Running Tests

```bash
npm run test           # Run all 180 tests
npm run test:coverage  # Coverage report (≥90% on core services)
```

## Emission Factor Sources

Emission factors sourced from [EPA](https://www.epa.gov/ghgemissions) and [IPCC](https://www.ipcc.ch/) standards.
