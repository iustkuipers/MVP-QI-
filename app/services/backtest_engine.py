from app.api.schemas import BacktestRequest
from app.services.market_data.loader import load_prices
from app.services.portfolio.simulator import simulate_portfolio
from app.services.metrics.metrics import compute_metrics
from app.services.serialization.series import serialize_series


def run_backtest(request: BacktestRequest | dict) -> dict:
    # --- Normalize input ---
    if isinstance(request, dict):
        request = BacktestRequest(**request)

    # --- 1. Collect tickers ---
    equity_tickers = [p.ticker for p in request.positions]
    tickers = equity_tickers.copy()

    if request.benchmark_ticker:
        tickers.append(request.benchmark_ticker)

    # --- 2. Load prices ---
    prices = load_prices(
        tickers=tickers,
        start_date=request.start_date,
        end_date=request.end_date,
        provider=request.data_provider,
    )

    # --- 3. Portfolio simulation ---
    portfolio_result = simulate_portfolio(
        prices=prices[equity_tickers],
        weights={p.ticker: p.weight for p in request.positions},
        initial_capital=request.initial_cash,
        allow_fractional_shares=request.fractional_shares,
        risk_free_rate=request.risk_free_rate,
        risk_free_compounding=request.risk_free_compounding,
        rebalance=request.rebalance,
    )

    # --- 4. Benchmark simulation ---
    benchmark_result = None
    if request.benchmark_ticker:
        benchmark_result = simulate_portfolio(
            prices=prices[[request.benchmark_ticker]],
            weights={request.benchmark_ticker: 1.0},
            initial_capital=request.initial_cash,
            allow_fractional_shares=True,
            risk_free_rate=0.0,
            rebalance="none",
        )

    # --- 5. Metrics ---
    metrics = compute_metrics(
        nav=portfolio_result.nav,
        returns=portfolio_result.daily_returns,
        risk_free_rate=request.risk_free_rate,
        benchmark_nav=benchmark_result.nav if benchmark_result else None,
        benchmark_returns=benchmark_result.daily_returns if benchmark_result else None,
    )

    # --- 6. Split & sanitize metrics ---
    relative_metric_keys = {
        "excess_return",
        "tracking_error",
        "information_ratio",
    }

    portfolio_metrics = {
        k: float(v)
        for k, v in metrics.items()
        if k not in relative_metric_keys
    }

    relative_metrics = (
        {
            k: float(v)
            for k, v in metrics.items()
            if k in relative_metric_keys
        }
        if benchmark_result
        else None
    )

    # --- 7. Serialize time series ---
    return {
        "success": True,
        "series": {
            "nav": serialize_series(portfolio_result.nav),
            "equity": serialize_series(portfolio_result.equity_value),
            "cash": serialize_series(portfolio_result.cash),
            "benchmark_nav": (
                serialize_series(benchmark_result.nav)
                if benchmark_result
                else None
            ),
        },
        "portfolio_metrics": portfolio_metrics,
        "relative_metrics": relative_metrics,
        "issues": portfolio_result.issues,
    }
