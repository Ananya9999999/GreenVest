# GreenVest

**Land intelligence for investors and landowners.**

GreenVest helps users discover land opportunities, understand environmental conditions through satellite and live weather data, and make data-driven decisions about the best way to invest — for both financial returns and climate impact.

> We didn’t add three features — we gave the same recommendation engine three more real-world inputs: what the land actually is, what it’s near, and what the weather is about to do.

---

## What GreenVest Does

| Capability | Description |
|------------|-------------|
| **Land Discovery** | Own land or explore the marketplace |
| **Interactive Maps** | 2D satellite + 3D terrain + boundaries |
| **Land Health Score** | Soil, water, climate, vegetation, terrain, proximity |
| **Smart Data Layer** | Soil classification, budget constraints, planting-window alerts |
| **Personalized Preferences** | Weight carbon, ROI, risk, biodiversity, water efficiency |
| **AI Land Advisor** | Top 3 plantation strategies with detailed crop/tree mixes and area allocation |
| **Live Weather + Planting Windows** | Real Open-Meteo forecast → “Plant now” / “Wait” / “Caution” signals |
| **Carbon & Investment Analysis** | Sequestration forecasts, credit potential, cost calculator, climate risk |
| **AI Chatbot** | Context-aware guidance on strategies, ROI, weather, and land health |
| **Monitoring** | Track vegetation growth, carbon accumulation, land health |

---

## New Features (Recent)

### 1. Live Weather API + Real Planting-Window Alerts
- Uses **Open-Meteo** (free, no API key) for 7-day forecasts
- Inputs: latitude & longitude from the land record
- Pulls: precipitation, temperature min/max, soil moisture, wind
- Planting-window engine produces:
  - `plant_now` | `wait` | `caution`
  - Window start/end dates
  - Clear human messages (“Plant now” / “Wait 4–6 days — heavy rain risk”)
- Cached (1–3 hours) to avoid rate limits
- Graceful fallback if the weather API is down
- Badge shown on **Analyze** and **Dashboard** pages
- Status also feeds into the chatbot

**Endpoints:**
- `GET /api/weather?lat=&lon=`
- `GET /api/weather/{land_id}`
- `GET /api/planting-window?lat=&lon=&strategy=`
- `GET /api/weather-and-windows?lat=&lon=`

### 2. Elaborate Plantation Strategies
Strategies are no longer generic. Each recommendation now includes:

- Exact crops / trees / species to plant
- Area allocation (hectares + acres + %)
- Purpose of each block (short-cycle cash / long-term timber / soil building)
- Expected cash-flow cycle
- Detailed planting plan written for the user’s budget, area, soil and goals

**Example (5 acres + ₹5 Lakh budget, wants money every 4 months + long-term investment):**

| Strategy | Allocation |
|----------|------------|
| **Balanced** | 1.5 acres → Amla / Moringa / Guava + legumes<br>2.5 acres → Teak / Mahogany + bamboo<br>1.0 acre → Understory legumes / fodder |
| **Maximum ROI** | 1.3 acres → Maize + Lablab (or Turmeric/Ginger)<br>3.7 acres → Commercial bamboo |
| **Maximum Carbon** | 0.7 acres → Nitrogen-fixing nurse species<br>4.3 acres → Native hardwoods + clumping bamboo |

### 3. Optional Grok-Powered Strategy Refinement
- When `XAI_API_KEY` is set, the advisor can call the xAI Grok API to further refine species mix, area splits and recommendation reasons.
- Completely optional — falls back to the strong rule-based engine if the key is missing.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Pydantic, SQLite |
| Weather | Open-Meteo Forecast API |
| AI (optional) | xAI Grok API |
| Maps | Leaflet / satellite layers |
| Payments | Razorpay + UPI |

---

## Project Structure

```
GreenVest/
├── backend/
│   ├── src/
│   │   ├── advisor/          # Strategy generation + ranking
│   │   ├── api/              # FastAPI routes
│   │   ├── chatbot/          # Context-aware assistant
│   │   ├── services/
│   │   │   ├── weather.py    # Open-Meteo + planting windows
│   │   │   └── grok_advisor.py
│   │   ├── models/           # Pydantic schemas
│   │   └── ...
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── analyze/      # Main strategy + weather badge page
│   │   │   ├── auth/         # Sign-in / Register
│   │   │   ├── dashboard/
│   │   │   └── ...
│   │   ├── components/
│   │   │   └── weather/      # PlantingStatusBadge
│   │   └── ...
│   └── package.json
├── LICENSE
└── README.md
```

---

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: enable Grok-enhanced strategies
export XAI_API_KEY=your_xai_api_key

uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `XAI_API_KEY` | No | xAI Grok API key for richer strategy generation |
| `GROK_MODEL` | No | Defaults to `grok-3-mini` |
| `NEXT_PUBLIC_API_URL` | No | Backend URL (defaults to `http://localhost:8000`) |
| `RAZORPAY_KEY_ID` | No | For payments |
| `RAZORPAY_KEY_SECRET` | No | For payments |

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Full land analysis + top 3 strategies |
| GET | `/api/weather` | Live 7-day forecast |
| GET | `/api/planting-window` | Plant now / Wait / Caution signal |
| GET | `/api/weather-and-windows` | Forecast + all strategy windows |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/chat` | Context-aware chatbot |

---

## User Flow

```
ENTER LOCATION / SELECT LAND
        ↓
LAND CLASSIFICATION + MAP
        ↓
SATELLITE + LIVE WEATHER DATA
        ↓
LAND HEALTH SCORE
        ↓
SET PREFERENCES + BUDGET
        ↓
AI LAND ADVISOR
(Top 3 strategies with area allocation)
        ↓
CARBON FORECAST + ROI ANALYSIS
        ↓
PLANTING-WINDOW ALERTS
        ↓
CHOOSE STRATEGY → MONITOR IMPACT
```

---

## License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.

---

## Contact

Built by **Git Happens**  
GitHub: [Ananya9999999/GreenVest](https://github.com/Ananya9999999/GreenVest)
