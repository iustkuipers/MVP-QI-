# Quant Insights Frontend

A modern React dashboard for quantitative portfolio backtesting with real-time visualization and metrics.

## Status: Step 2 Complete ✅

**Form submission works end-to-end** → **Charts render live data** → **Metrics display correctly**

---

## Features

### Form Input (Step A)
- ✅ Dynamic position management (add/remove positions)
- ✅ Date range selection
- ✅ Initial capital input
- ✅ Risk-free rate configuration
- ✅ Benchmark ticker selection (optional)
- ✅ Fractional shares toggle
- ✅ Risk-free compounding frequency (daily, quarterly, yearly, continuous)
- ✅ Case-insensitive ticker input (auto-uppercased)
- ✅ Form state persists after backtest execution

### Charts (Step 2)
- ✅ **Portfolio NAV vs Benchmark** (line chart with optional benchmark overlay)
- ✅ **Equity vs Cash Composition** (area chart with total NAV line overlay)
- Built with Recharts (performant, declarative, responsive)

### Metrics Display
- ✅ Portfolio metrics (total return, CAGR, volatility, Sharpe, max drawdown)
- ✅ Relative metrics when benchmark provided (excess return, tracking error, info ratio)
- ✅ Proper formatting (percentages, decimals, currency)

### State Management
- ✅ Loading states with spinner
- ✅ Error handling with recovery
- ✅ Form values persist (doesn't reset after backtest)
- ✅ Responsive layout

---

## Quick Start

### Prerequisites
- Node.js 16+
- Backend running on `http://localhost:8000`

### Installation & Run

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Build for production
npm run build
```

Backend must be running:
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

---

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── api/
│   │   ├── types.ts                # Type definitions (mirror backend)
│   │   ├── client.ts               # HTTP client (fetch wrapper)
│   │   └── backtest.ts             # Backtest endpoint
│   ├── adapters/
│   │   └── backtestAdapter.tsx     # Response validation + transformation
│   ├── hooks/
│   │   └── useBacktest.ts          # State management hook
│   ├── components/
│   │   ├── charts/
│   │   │   ├── NavChart.tsx        # Portfolio NAV vs Benchmark
│   │   │   ├── EquityCashChart.tsx # Equity vs Cash composition
│   │   │   └── Chart.types.ts      # Chart prop interfaces
│   │   ├── panels/
│   │   │   ├── PortfolioMetricsPanel.tsx
│   │   │   ├── RelativeMetricsPanel.tsx
│   │   │   └── IssuesPanel.tsx
│   │   └── common/
│   │       ├── BacktestForm.tsx    # Input form (controlled component)
│   │       ├── LoadingState.tsx
│   │       ├── ErrorState.tsx
│   │       └── EmptyState.tsx
│   ├── pages/
│   │   └── BacktestPage/
│   │       ├── BacktestPage.tsx    # Page orchestration + form state
│   │       ├── BacktestPage.styles.ts
│   │       └── BacktestPage.types.ts
│   ├── styles/
│   │   ├── theme.ts                # Design tokens
│   │   └── globals.css             # Base styles
│   └── utils/
│       ├── number.ts               # formatPercent, formatCurrency, etc
│       ├── date.ts                 # Date formatting
│       └── guards.ts               # Type guards
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.local                      # API base URL config
```

---

## Architecture

### Layered Design
```
UI Components (dumb rendering)
    ↓
Page Container (state orchestration + form state)
    ↓
Hook (data fetching + state management)
    ↓
Adapter (response validation + transformation)
    ↓
API Client (HTTP layer)
    ↓
Backend /api/v1/backtest
```

**Key Principles:**
- Backend is source of truth (never recompute metrics)
- No calculations in components (only formatting)
- Form state at page level (persists across renders)
- Types mirror backend exactly (prevents silent failures)
- Charts are pure presentational (data flows in, renders out)

---

## Supported Tickers (Mock Data)

- **Tech**: AAPL, MSFT
- **Broad Market**: VOO, SPY, IVV, QQQ, VTI
- **Bonds**: AGG, BND
- **Other**: AEX, IUST

Any combination can be used as positions OR benchmarks.

---

## Type Safety

All types in `src/api/types.ts` are hand-synced with backend response structure. Before running a backtest, check [backend example response](../response_body.json) if you're unsure about data shape.

---

## Environment Variables

Create `.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000
```

Accessed in code as: `import.meta.env.VITE_API_BASE_URL`

---

## Next Steps (Step 3)

**Polish phase:**
- Form validation (catch errors before API call)
- Responsive design (mobile-friendly breakpoints)
- Better error messages (user-facing feedback)
- Unit tests (Jest + React Testing Library)
- Accessibility (a11y improvements)
- Optional: Drawdown chart, additional metrics visualization

---

## Debugging

### White screen?
1. Check browser console for errors
2. Verify `.env.local` has correct API URL
3. Ensure backend is running on port 8000

### API errors?
1. Check Network tab (DevTools) for request/response
2. Verify form values are valid (dates, numbers, tickers)
3. Check backend logs for server errors

### Data not showing?
1. Ensure backtest completed successfully (no error state)
2. Verify API response has correct structure (check adapter)
3. Check that tickers are supported by mock provider

---

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool + dev server
- **Recharts** - Chart library
- **Fetch API** - HTTP client

---

## Notes

- Charts are currently using mock market data (see `backend/app/services/market_data/providers/mock.py`)
- Backtests run deterministically (seed=42 for reproducibility)
- Response times typically 2-5 seconds depending on date range
```

Then:
1. Open `http://localhost:3000`
2. See form with defaults
3. Click "Run Backtest"
4. Wait 5-30 seconds
5. See results or error

### Without Backend (For Testing Architecture)

Edit `src/api/client.ts` temporarily to return mock data instead of calling API.

---

## What You'll See

### Initial Page
```
Backtest Analysis
┌─────────────────────────────────┐
│  Backtest Parameters             │
├─────────────────────────────────┤
│ Date Range                       │
│  Start: 2020-01-01 [input]      │
│  End:   2021-01-01 [input]      │
├─────────────────────────────────┤
│ Capital                          │
│  Initial Cash: 100000 [input]   │
├─────────────────────────────────┤
│ Positions                        │
│  AAPL  [0.4] MSFT  [0.4]        │
│  IUST  [0.1]                    │
├─────────────────────────────────┤
│ Benchmark & Risk                │
│  Benchmark: VOO [input]         │
│  Risk-Free Rate: 0.03 [input]  │
├─────────────────────────────────┤
│      [RUN BACKTEST BUTTON]       │
└─────────────────────────────────┘
```

### After Clicking "Run Backtest"
```
[Loading Spinner]
Running backtest...
(Button disabled)
```

### When Results Arrive
```
Backtest Analysis
[FORM - still visible for retry]

Portfolio NAV                Equity vs Cash
[Chart Placeholder]         [Chart Placeholder]

Portfolio Metrics           Relative to Benchmark
Total Return: -0.99%       Excess Return: 3.51%
CAGR: -0.99%              Tracking Error: 19.67%
Volatility: 12.85%        Information Ratio: 0.17
Sharpe: -0.25
Max Drawdown: -12.69%
```

### If Error Occurs
```
[ERROR MESSAGE BOX]
Error details shown

[FORM appears below to retry]
```

---

## Key Points

✅ **The app is not "dead" anymore**
- Form exists
- Submit button works
- API gets called
- Data displays

✅ **Complete end-to-end flow**
- No steps skipped
- No "TODO" placeholders in flow
- Real error handling

✅ **Architecture is sound**
- Types are correct
- Data flow is clean
- Adapter works as designed
- All layers integrated

❌ **Charts are placeholders**
- They show data point count
- Not actual visualizations
- That's Step B

---

## Files Modified

**New:**
- `src/components/common/BacktestForm.tsx` (150 lines)
- `src/__tests__/dataFlow.test.ts` (validation)

**Updated:**
- `src/pages/BacktestPage/BacktestPage.tsx` (integrated form)
- `src/api/backtest.ts` (correct endpoint)

**Documentation:**
- `SETUP.md`
- `STEP_A_COMPLETE.md`
- `VALIDATION_CHECKLIST.md`

---

## Next Step: STEP B (Charts)

When ready to add actual charts:

1. Install Recharts: `npm install recharts`
2. Update `NavChart.tsx` to render LineChart
3. Update `EquityCashChart.tsx` to render AreaChart
4. Everything else stays the same

See `QUICK_REFERENCE.md` for exact code.

---

## Summary

**STEP A is complete and the app works.**

You can now:
- ✅ Run backtests via form
- ✅ See loading states
- ✅ See results or errors
- ✅ Adjust parameters and retry
- ✅ Understand the full data flow

**Not yet:**
- ❌ Beautiful charts (Step B)
- ❌ Form validation (nice-to-have)
- ❌ Styling polish (nice-to-have)

The core is done. The architecture is correct. The ignition switch works.
