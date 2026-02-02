# Quant Insights Backend & Frontend

A comprehensive portfolio backtesting platform with visual comparison and analysis tools.

## Overview

Quant Insights is a full-stack backtesting platform combining a robust Python backend with an interactive React frontend. Simulate portfolio performance, compare strategies side-by-side, and analyze rolling metrics with visual clarity. Share reproducible analyses via shareable links.

**Current Version: v1.3** - Options Strategy Timeline with Entry/Expiry Markers

## Features

### Backend
- **Market Data Loading**: Support for multiple data providers (mock, Yahoo Finance, and more)
- **Portfolio Simulation**: Flexible portfolio simulator with configurable:
  - Rebalancing strategies
  - Risk-free rate accrual (daily, quarterly, yearly, continuous compounding)
  - Fractional share support
- **Comprehensive Metrics**: Calculate key performance indicators including:
  - Total Return & CAGR
  - Volatility & Sharpe Ratio
  - Maximum Drawdown
  - Rolling metrics (4-window analysis)
  - Excess Return, Tracking Error & Information Ratio (vs benchmark)
- **Benchmark Comparison**: Support any ticker as benchmark (same ticker as position allowed)
- **Options Pricing Engine** (v1.2):
  - Black-Scholes European option pricing
  - Real-time option valuation with historical volatility
  - Support for both call and put options
  - Individual entry date tracking for each position
- **Strategy Timeline Analysis** (v1.3 Enhanced!):
  - Compute portfolio value across historical date ranges
  - Compare strategy performance vs buy-and-hold baseline
  - Accurate option premium accounting
  - Multi-leg strategy support (calls, puts, stock positions)
  - **NEW**: Per-position entry date tracking (portfolio flat before entry)
  - **NEW**: Multiple entry/expiry date markers with position numbers
  - **NEW**: Automatic spot price interpolation for non-trading dates

### Frontend (v1.3 Enhanced!)
- **Options Sandbox**:
  - Define multi-leg option strategies (calls, puts, stock positions)
  - Specify individual entry dates and premiums paid/received
  - Single symbol picker for unified analysis
  - Simulation period selection (date range)
  - Market assumptions (volatility, risk-free rate, dividend yield)
- **Strategy Timeline Visualization** (v1.3 Enhanced!):
  - **3-line chart**:
    - Gray underlying asset price (historical close)
    - Green portfolio value (options + stock combined)
    - Orange buy-and-hold baseline (using deployed capital)
  - **Entry/Expiry Markers** (NEW v1.3):
    - Blue dashed vertical lines at each position's entry date (labeled with position #)
    - Red dashed vertical lines at each position's expiry date (labeled with position #)
    - Portfolio remains flat at deployed capital before entry dates
    - Option values zero out at/after expiry dates
  - **Interactive Tooltips** (NEW v1.3):
    - Hover over chart to see exact date and all three line values
    - Shows underlying price, strategy value, and buy-and-hold comparison
  - Legend below chart with clear line identification
  - Shows exact values at start/end dates
  - Delta calculation for strategy vs baseline performance
- **Portfolio Comparison Mode** (v1.1):
  - Run two backtests side-by-side with dual independent form configurations
  - Portfolio A live preview while Portfolio B runs
  - Metrics comparison table with semantic delta coloring
  - Side-by-side portfolio charts (NAV, Equity/Cash allocation)
- **Rolling Metrics Analysis** (v1.1):
  - Track 4 metrics over time with tabbed interface
  - "Show only valid period" toggle to hide NaN padding
  - Works in both single and comparison modes
- **Shareable Links** (v1.1):
  - Encode & share reproducible backtests
  - Auto-restore and auto-run on link open
  - URL-safe compression (LZ + base64 fallback)
- **Styling** (v1.3):
  - Clean white/blue color scheme
  - Light gray grid lines for readability
  - Professional typography and spacing

## Getting Started

### Backend Setup

1. **Clone the repository**
```bash
git clone <repo-url>
cd backend
```

2. **Create a virtual environment**
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux
```

3. **Install dependencies**
```bash
pip install pandas numpy pydantic pytest fastapi uvicorn
```

For Yahoo Finance provider:
```bash
pip install yfinance
```

4. **Run the server**
```bash
python -m uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Project Structure

```
quant_insights/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── schemas.py           # Pydantic request/response schemas
│   │   │   └── routes/
│   │   │       ├── backtest.py      # FastAPI endpoints for backtesting
│   │   │       ├── options.py       # FastAPI endpoints for options analysis
│   │   │       ├── market.py        # Market data endpoints
│   │   │       └── strategy.py      # Strategy endpoints
│   │   ├── core/
│   │   │   ├── config.py            # Configuration management
│   │   │   └── exceptions.py        # Custom exceptions
│   │   ├── services/
│   │   │   ├── backtest_engine.py   # Main backtesting orchestration
│   │   │   ├── market_data/         # Data loading and providers
│   │   │   │   └── providers/       # Mock, Yahoo Finance, etc.
│   │   │   ├── metrics/             # Analytics and metrics calculation
│   │   │   ├── portfolio/           # Portfolio simulation
│   │   │   ├── options/             # Options pricing and analysis
│   │   │   │   ├── pricing/         # Black-Scholes, binomial, greeks
│   │   │   │   ├── core/            # Option instruments and market data
│   │   │   │   ├── portfolio/       # Option portfolio management
│   │   │   │   ├── scenarios/       # Monte Carlo, stress tests, surfaces
│   │   │   │   ├── timeline.py      # Strategy timeline computation
│   │   │   │   └── volatility/      # Volatility models
│   │   │   └── serialization/       # Data serialization for frontend
│   │   └── tests/
│   ├── request_body.json
│   └── response_body.json
└── frontend/
    ├── src/
    │   ├── api/                     # API client & types
    │   │   ├── backtest.ts          # Backtest API calls
    │   │   ├── options.ts           # Options API calls
    │   │   ├── client.ts            # Axios client config
    │   │   └── types.ts             # TypeScript interfaces
    │   ├── components/              # Reusable UI components
    │   │   ├── charts/              # Recharts visualizations
    │   │   ├── common/              # Forms, toggles, states
    │   │   ├── options/             # Options-specific components
    │   │   │   ├── StrategyBuilder.tsx
    │   │   │   ├── MarketAssumptions.tsx
    │   │   │   ├── StrategyTimelineGraph.tsx
    │   │   │   ├── SymbolPicker.tsx
    │   │   │   └── SimulationSettings.tsx
    │   │   └── panels/              # Metrics, comparison tables
    │   ├── hooks/                   # Custom React hooks
    │   │   ├── useBacktest.ts       # Backtest hook
    │   │   └── useBacktestComparison.ts
    │   ├── pages/                   # Page components
    │   │   ├── BacktestPage/        # Portfolio backtesting
    │   │   └── OptionsSandbox/      # Options strategy analysis
    │   ├── adapters/                # API response → UI transform
    │   ├── utils/                   # Helpers (comparison links, etc)
    │   └── styles/                  # Theme & global styles
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```


## Usage

### Using the Web Interface

1. Open [Portfolio Lab](http://localhost:5173) in your browser
2. **Portfolio Backtesting Mode**: Configure a portfolio and click "Run Backtest"
   - View results, share with "Copy run link"
   - Compare mode: Run a second portfolio and view side-by-side metrics, charts, rolling analysis
   - Share either run or comparison using the copy button (auto-restores on link open)
3. **Options Sandbox** (New): Create and analyze multi-leg option strategies
   - Select underlying symbol (e.g., AAPL)
   - Define positions: add calls, puts, and stock positions with individual entry dates and premiums
   - Set simulation period and market assumptions (volatility, risk-free rate, dividend yield)
   - Click "Run Simulation" to see strategy timeline vs buy-and-hold
   - Visualize portfolio value, underlying price, and baseline comparison across historical dates

### Backend API

Run a backtest via REST API:

```bash
curl -X POST "http://localhost:8000/backtest" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2020-01-01",
    "end_date": "2023-12-31",
    "initial_cash": 100000,
    "positions": [
      {"ticker": "AAPL", "weight": 0.4},
      {"ticker": "MSFT", "weight": 0.3},
      {"ticker": "VOO", "weight": 0.3}
    ],
    "risk_free_rate": 0.02,
    "benchmark_ticker": "VOO",
    "data_provider": "mock",
    "rebalance": "daily",
    "fractional_shares": true
  }'
```

### Python Backend

```python
from app.services.backtest_engine import run_backtest

config = {
    "start_date": "2020-01-01",
    "end_date": "2023-12-31",
    "initial_cash": 100000,
    "positions": [
        {"ticker": "AAPL", "weight": 0.4},
        {"ticker": "MSFT", "weight": 0.3},
        {"ticker": "VOO", "weight": 0.3}
    ],
    "risk_free_rate": 0.02,
    "benchmark_ticker": "VOO",
    "data_provider": "mock",
    "rebalance": "daily"
}

result = run_backtest(config)
print(result["portfolio_metrics"])
````

### Using the Mock Provider

The mock provider generates deterministic price data using geometric Brownian motion with seed=42:

```python
from app.services.market_data.loader import load_prices

prices = load_prices(
    tickers=["AAPL", "MSFT", "VOO"],
    start_date="2020-01-01",
    end_date="2023-12-31",
    provider="mock"
)
```

**Supported tickers:**
- Tech: AAPL, MSFT
- Broad Market: VOO, SPY, IVV, QQQ, VTI
- Bonds: AGG, BND
- Other: AEX, IUST

Any combination can be used as positions or benchmarks (including the same ticker for both).

## Running Tests

### Unit Tests
```bash
# Test metrics calculations
python -m pytest app/tests/test_metrics.py -v

# Test loader functionality
python -m pytest app/tests/test_loader.py -v
```

### Integration Test
```bash
# Run full backtest with sample data
python -m app.tests.test_run_backtest
```

## API Schemas

### BacktestRequest

```python
{
    "start_date": str,              # YYYY-MM-DD
    "end_date": str,                # YYYY-MM-DD
    "initial_cash": float,          # > 0
    "positions": [
        {
            "ticker": str,          # e.g., "AAPL"
            "weight": float         # 0 < weight <= 1
        }
    ],
    "risk_free_rate": float,        # -0.5 to 1.0
    "benchmark_ticker": str | null, # Optional benchmark
    "rebalance": str,               # "none", "monthly", "daily"
    "data_provider": str,           # "mock", "yahoo"
    "fractional_shares": bool,      # Allow fractional shares
    "compounding": bool             # Risk-free rate compounding
}
```

### BacktestResponse

```python
{
    "success": bool,
    "portfolio_metrics": {
        "total_return": float,
        "cagr": float,
        "volatility": float,
        "sharpe": float,
        "max_drawdown": float
    },
    "benchmark_metrics": {
        "excess_return": float,
        "tracking_error": float,
        "information_ratio": float
    } | null,
    "series": {
        "nav": {
            "dates": [str],
            "values": [float]
        },
        "benchmark_nav": {...} | null
    },
    "issues": [str]
}
```

## Release Notes

### v1.2 - Options Sandbox & Strategy Timeline Analysis (Current)

**Backend Enhancements:**
- ✨ **Options Pricing Engine**:
  - Black-Scholes European option pricing model
  - Support for call and put options
  - Real-time option valuation with historical market data
  - Proper handling of implied volatility
- ✨ **Strategy Timeline Endpoint**: `/api/v1/options/strategy-timeline`
  - Compute portfolio value across any historical date range
  - Support for multi-leg strategies (calls, puts, stock positions)
  - Individual entry date tracking per position
  - Premium/entry price accounting
  - Buy-and-hold baseline comparison

**Frontend Enhancements:**
- ✨ **Options Sandbox Tool** (New Page):
  - Symbol picker for unified analysis
  - Strategy builder with position management:
    - Support for calls, puts, and stock positions
    - Per-position entry date and premium fields
    - Easy add/remove position workflow
  - Simulation period selector (start/end dates)
  - Market assumptions panel (volatility, risk-free rate, dividend yield)
  - Real-time strategy timeline visualization
- ✨ **Strategy Timeline Graph** (New Component):
  - 3-line comparison chart using Recharts:
    - Underlying asset price (blue)
    - Portfolio value with all legs (green)
    - Buy-and-hold baseline (orange, dashed)
  - Initial cost and spot price display
  - Final value comparison and delta calculation
  - Proper temporal handling: options only show value from entry date

**Technical Improvements:**
- Options only have values from their individual entry dates (not before)
- Accurate premium handling for strategy cost basis
- Historical data integration with option pricing calculations

**Backward Compatibility:**
- v1.1 portfolio comparison and backtesting features fully functional
- All existing APIs unchanged

### v1.1 - Portfolio Comparison & Shareable Links

**Frontend Enhancements:**
- ✨ **Portfolio Comparison Mode**: Run two backtests side-by-side
- ✨ **Shareable Links**: Reproducible analysis sharing
- ✨ **Rolling Metrics Analysis**: 4-window metric tracking
- 🎨 **Metric-Aware Delta Coloring**: Semantic accuracy
- 🐛 **Bug Fixes**: Chart rendering and layout issues

**Backend (Stable):**
- No breaking changes to API
- All existing metrics continue to work
- Full backward compatibility

### v1.0 - Initial Release
- Core backtesting engine with metric calculation
- Market data loading (mock provider)
- API endpoints for backtest execution
- Response serialization for frontend visualization

## Key Modules

### Market Data Loader
Standardizes price data from various providers into a consistent format with DatetimeIndex and tickers as columns.

### Portfolio Simulator
Simulates portfolio NAV with support for:
- Multiple rebalancing strategies
- Fractional share trading
- Risk-free cash accrual
- Trade tracking

### Metrics Engine
Computes performance metrics with optional benchmark comparison:
- **Portfolio Metrics**: Return, volatility, Sharpe ratio, drawdown
- **Relative Metrics**: Excess return, tracking error, information ratio

## Configuration

Edit `app/core/config.py` to customize:
- Trading days per year (default: 252)
- Risk-free rate defaults
- Data provider settings

## Development

### Adding a New Data Provider

1. Create a new provider class in `app/services/market_data/providers/`
2. Inherit from `MarketDataProvider`
3. Implement the `load()` method
4. Register in `loader.py`

### Adding New Metrics

1. Add calculation function to `app/services/metrics/metrics.py`
2. Update `compute_metrics()` to include the new metric
3. Add corresponding test in `app/tests/test_metrics.py`

## Performance Notes

- The mock provider uses a fixed random seed (42) for reproducibility
- All date ranges are business days only (excluding weekends/holidays)
- Portfolio simulator handles edge cases (zero positions, negative cash, etc.)

## Known Limitations

- Rebalancing only supports "none" strategy (monthly/daily coming soon)
- No transaction costs or slippage modeling
- Yahoo provider not yet implemented
- No portfolio optimization or statistical analysis

## Contributing

When contributing:
1. Write tests for new features
2. Run full test suite: `pytest app/tests/ -v`
3. Follow existing code style and structure
4. Update this README with new features

## License

[Add appropriate license]

## Support

For issues or questions, please open an issue in the repository.
