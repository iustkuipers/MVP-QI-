# Frontend Development Guide

## Quick Start

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Set environment (create .env.local)
REACT_APP_API_BASE_URL=http://localhost:8000

# 3. Start dev server
npm start
```

App opens at `http://localhost:3000`

---

## Architecture (3-Layer)

### 1. API Layer → 2. Adapter Layer → 3. Hooks/Components

**API Layer** (`src/api/`)
- `types.ts` - Types mirror backend 1:1
- `backtest.ts` - Calls `/api/v1/backtest`

**Adapter Layer** (`src/adapters/`)
- Transforms API response to UI structure
- Checks `success` flag, throws on error
- Makes benchmark/metrics optional (null, not undefined)

**Hooks** (`src/hooks/useBacktest.ts`)
- Returns `{ data, loading, error, run, clear }`
- Manages state and error handling

**Components** (`src/components/`)
- **Pages**: Orchestrate layout, manage page state
- **Charts**: Dumb components, receive series only
- **Panels**: Format and display metrics
- **Common**: Loading, error, empty states

---

## Core Principles

✅ **Backend is source of truth** - Never recompute metrics  
✅ **Series immutable** - Never modify dates/values arrays  
✅ **Charts dumb** - Only receive { dates[], values[] }  
✅ **Types match backend** - Field names like `total_return` (not camelCase)  
✅ **Unidirectional flow** - API → Adapter → Hook → Page → Components  

---

## File Structure

```
src/
├── api/              ← HTTP layer
│   ├── types.ts
│   ├── client.ts
│   └── backtest.ts
├── adapters/         ← Transform API response
│   └── backtestAdapter.ts
├── pages/            ← Orchestration
│   └── BacktestPage/
├── components/       ← UI
│   ├── charts/       (NavChart, EquityCashChart)
│   ├── panels/       (PortfolioMetrics, RelativeMetrics, Issues)
│   └── common/       (LoadingState, ErrorState, Form)
├── hooks/            ← State management
│   └── useBacktest.ts
├── utils/            ← Helpers
│   ├── number.ts     (formatPercent, formatDecimal)
│   ├── date.ts
│   └── guards.ts
└── styles/           ← Theme & globals
```

---

## Data Flow

```
User submits form
  ↓
run(payload) in hook
  ↓
API POST /api/v1/backtest
  ↓
Adapter transforms response
  ↓
Hook updates state
  ↓
Page re-renders with metrics & charts
```

---

## Key Types

```typescript
// From backend
TimeSeries = { dates: string[], values: number[] }

BacktestResponse = {
  success: boolean,
  series: {
    nav: TimeSeries,
    equity: TimeSeries,
    cash: TimeSeries,
    benchmark_nav?: TimeSeries
  },
  portfolio_metrics: {
    total_return, cagr, volatility, sharpe, max_drawdown
  },
  relative_metrics?: { excess_return, tracking_error, information_ratio },
  issues: string[]
}

// From adapter
AdaptedData = {
  navSeries, equitySeries, cashSeries, benchmarkSeries,
  portfolioMetrics, relativeMetrics, issues
}
```

---

## Testing

### With Backend
```bash
# Terminal 1
cd backend && python -m uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm start
```

Then go to form, click "Run Backtest", wait 5-30s for results.

### Without Backend
Edit `src/api/client.ts` to return mock data temporarily.

---

## Next: Add Charts (Step B)

1. `npm install recharts`
2. Update `src/components/charts/NavChart.tsx`:
   ```tsx
   import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
   
   export function NavChart({ series, benchmark }: NavChartProps) {
     const data = series.dates.map((date, i) => ({
       date,
       nav: series.values[i],
       benchmark: benchmark?.values[i]
     }));
     
     return (
       <LineChart data={data}>
         <CartesianGrid />
         <XAxis dataKey="date" />
         <YAxis />
         <Tooltip />
         <Line type="monotone" dataKey="nav" stroke="#2563eb" />
         {benchmark && <Line type="monotone" dataKey="benchmark" stroke="#9ca3af" />}
       </LineChart>
     );
   }
   ```
3. Do same for `EquityCashChart.tsx` using `AreaChart`
4. Everything else stays the same

---

## Status

✅ Form integrated  
✅ Data flow works end-to-end  
✅ Error handling implemented  
✅ Metrics display working  
❌ Charts are placeholders (next step)  

That's it. No clutter.
