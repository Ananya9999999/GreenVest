# GreenVest Frontend

Next.js 14 (App Router) + React + Tailwind + Framer Motion.

## Palette

- **Olive** — primary (headers, CTAs, scores)
- **Cream** — backgrounds, cards
- **Brown** — accents (badges, secondary emphasis)

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing — hero, features, flow, CTA |
| `/discover` | Own-land intake (location, area, budget, horizon) |
| `/marketplace` | Listings with UserID, health score, soil, carbon |
| `/analyze` | Health score, preference weights, top 3 strategies, carbon forecast, AI chatbot |
| `/dashboard` | Monitoring + planting alerts |

## Setup

```bash
cd greenvest-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS (custom olive / cream / brown)
- Framer Motion (page entrances, cards, chat panel, nav underline)
- Lucide icons

## Integration

Types in `src/types` mirror the AI module schemas (LandInput, PreferenceWeights, strategies, marketplace listings). Wire API routes / backend when ready.
