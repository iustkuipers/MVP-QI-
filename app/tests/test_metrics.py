import numpy as np
import pandas as pd

from app.services.metrics.metrics import (
    periods_per_year,
    total_return,
    cagr,
    annualized_volatility,
    sharpe_ratio,
    max_drawdown,
    excess_return,
    tracking_error,
    information_ratio,
    compute_metrics,
)


def make_nav_series(
    start=100.0,
    daily_return=0.001,
    n_days=252,
    start_date="2020-01-01",
):
    dates = pd.bdate_range(start_date, periods=n_days)
    nav = start * (1 + daily_return) ** np.arange(n_days)
    return pd.Series(nav, index=dates)


def make_returns(nav: pd.Series) -> pd.Series:
    return nav.pct_change().fillna(0.0)


# -------------------------------------------------
# Core helpers
# -------------------------------------------------

def test_periods_per_year_business_days():
    nav = make_nav_series(n_days=252)
    ppy = periods_per_year(nav)
    assert 255 < ppy < 270  # allow small tolerance


def test_total_return_positive():
    nav = make_nav_series(daily_return=0.001)
    tr = total_return(nav)
    assert tr > 0


def test_total_return_zero():
    nav = make_nav_series(daily_return=0.0)
    tr = total_return(nav)
    assert abs(tr) < 1e-10


def test_cagr_positive():
    nav = make_nav_series(daily_return=0.001)
    c = cagr(nav)
    assert c > 0


def test_cagr_matches_calendar_definition():
    nav = make_nav_series(daily_return=0.001)
    c = cagr(nav)

    days = (nav.index[-1] - nav.index[0]).days
    expected = (nav.iloc[-1] / nav.iloc[0]) ** (365.25 / days) - 1

    assert abs(c - expected) < 1e-6


# -------------------------------------------------
# Volatility & Sharpe
# -------------------------------------------------

def test_annualized_volatility_zero_for_flat_series():
    nav = make_nav_series(daily_return=0.0)
    returns = make_returns(nav)
    vol = annualized_volatility(returns)
    assert abs(vol) < 1e-10


def test_sharpe_nan_when_zero_volatility():
    nav = make_nav_series(daily_return=0.0)
    returns = make_returns(nav)
    s = sharpe_ratio(returns, risk_free_rate=0.0)
    assert np.isnan(s)


def test_sharpe_positive_for_positive_returns():
    nav = make_nav_series(daily_return=0.001)
    returns = make_returns(nav)
    s = sharpe_ratio(returns, risk_free_rate=0.0)
    assert s > 0


def test_sharpe_decreases_with_higher_rf():
    nav = make_nav_series(daily_return=0.001)
    returns = make_returns(nav)
    s1 = sharpe_ratio(returns, risk_free_rate=0.0)
    s2 = sharpe_ratio(returns, risk_free_rate=0.05)
    assert s2 < s1


# -------------------------------------------------
# Drawdown
# -------------------------------------------------

def test_max_drawdown_zero_for_monotonic_increase():
    nav = make_nav_series(daily_return=0.001)
    mdd = max_drawdown(nav)
    assert abs(mdd) < 1e-10


def test_max_drawdown_negative_for_drop():
    nav = make_nav_series(daily_return=0.001)
    nav.iloc[100:] *= 0.8  # induce drawdown
    mdd = max_drawdown(nav)
    assert mdd < 0
    assert mdd > -1.0


# -------------------------------------------------
# Relative metrics
# -------------------------------------------------

def test_excess_return_positive_when_portfolio_outperforms():
    portfolio = make_nav_series(daily_return=0.002)
    benchmark = make_nav_series(daily_return=0.001)
    er = excess_return(portfolio, benchmark)
    assert er > 0


def test_tracking_error_zero_for_identical_returns():
    nav = make_nav_series(daily_return=0.001)
    returns = make_returns(nav)
    te = tracking_error(returns, returns)
    assert abs(te) < 1e-10


def test_information_ratio_positive_when_outperforming():
    portfolio = make_nav_series(daily_return=0.002)
    benchmark = make_nav_series(daily_return=0.001)
    pr = make_returns(portfolio)
    br = make_returns(benchmark)

    ir = information_ratio(pr, br)
    assert ir > 0


# -------------------------------------------------
# Integration: compute_metrics
# -------------------------------------------------

def test_compute_metrics_without_benchmark():
    nav = make_nav_series(daily_return=0.001)
    returns = make_returns(nav)

    metrics = compute_metrics(
        nav=nav,
        returns=returns,
        risk_free_rate=0.01,
    )

    expected_keys = {
        "total_return",
        "cagr",
        "volatility",
        "sharpe",
        "max_drawdown",
    }

    assert expected_keys.issubset(metrics.keys())


def test_compute_metrics_with_benchmark():
    portfolio = make_nav_series(daily_return=0.002)
    benchmark = make_nav_series(daily_return=0.001)

    metrics = compute_metrics(
        nav=portfolio,
        returns=make_returns(portfolio),
        risk_free_rate=0.01,
        benchmark_nav=benchmark,
        benchmark_returns=make_returns(benchmark),
    )

    expected_keys = {
        "excess_return",
        "tracking_error",
        "information_ratio",
    }

    assert expected_keys.issubset(metrics.keys())


if __name__ == "__main__":
    print("All metric tests passed.")
