# Quant Insights Backend

A robust portfolio backtesting engine for quantitative analysis and performance evaluation.

## Overview

Quant Insights is a Python-based backtesting platform that simulates portfolio performance over historical data. It provides comprehensive metrics, risk analysis, and benchmark comparison capabilities for quantitative investment strategies.

## Features

- **Market Data Loading**: Support for multiple data providers (mock, Yahoo Finance, and more)
- **Portfolio Simulation**: Flexible portfolio simulator with configurable rebalancing and risk-free rate accrual
- **Comprehensive Metrics**: Calculate key performance indicators including:
  - Total Return & CAGR
  - Volatility & Sharpe Ratio
  - Maximum Drawdown
  - Tracking Error & Information Ratio
- **Benchmark Comparison**: Compare portfolio performance against benchmarks
- **JSON Serialization**: Frontend-ready data formats for visualization

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── core/
│   │   ├── config.py            # Configuration management
│   │   └── exceptions.py        # Custom exceptions
│   ├── services/
│   │   ├── backtest_engine.py   # Main orchestration logic
│   │   ├── market_data/         # Data loading and providers
│   │   │   ├── loader.py
│   │   │   └── providers/
│   │   │       ├── mock.py      # Deterministic GBM simulator
│   │   │       └── yfinance.py  # Yahoo Finance provider
│   │   ├── metrics/             # Analytics and metrics
│   │   │   └── metrics.py
│   │   ├── portfolio/           # Portfolio simulation
│   │   │   └── simulator.py
│   │   └── serialization/       # Data serialization
│   │       └── series.py
│   └── tests/
│       ├── test_metrics.py
│       └── test_run_backtest.py
├── request_body.json            # Example backtest request
└── response_body.json           # Example backtest response
```

## Installation

### Prerequisites
- Python 3.11+
- pip or conda

### Setup

1. **Clone the repository**
```bash
git clone <repo-url>
cd backend
```

2. **Create a virtual environment** (optional but recommended)
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux
```

3. **Install dependencies**
```bash
pip install pandas numpy pydantic pytest
```

For Yahoo Finance provider:
```bash
pip install yfinance
```

## Usage

### Running a Backtest

```python
from app.services.backtest_engine import run_backtest

request = {
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
    "rebalance": "none"
}

result = run_backtest(request)

# Output includes:
# - portfolio_metrics: performance statistics
# - benchmark_metrics: relative performance (if benchmark provided)
# - series: NAV timeseries for visualization
# - issues: any warnings or data quality issues
```

### Using the Mock Provider

The mock provider generates deterministic price data using geometric Brownian motion:

```python
from app.services.market_data.loader import load_prices

prices = load_prices(
    tickers=["AAPL", "MSFT", "VOO"],
    start_date="2020-01-01",
    end_date="2023-12-31",
    provider="mock"
)
```

Supported tickers: AAPL, MSFT, VOO, AEX, IUST

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
