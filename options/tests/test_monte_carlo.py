from datetime import date

from core.instruments import OptionContract
from core.market_data import MarketSnapshot
from portfolio.portfolio import Position
from scenarios.monte_carlo import monte_carlo_scenario


TODAY = date(2026, 1, 22)


def make_strategy():
    call = OptionContract(
        symbol="AAPL",
        option_type="call",
        style="european",
        strike=180,
        expiry=date(2026, 6, 19),
    )

    put = OptionContract(
        symbol="AAPL",
        option_type="put",
        style="european",
        strike=160,
        expiry=date(2026, 6, 19),
    )

    return [
        Position(call, 1.0),
        Position(put, -1.0),
    ]


def make_market(spot=185, vol=0.25):
    return MarketSnapshot(
        spot=spot,
        rate=0.03,
        dividend_yield=0.005,
        volatility=vol,
        timestamp="2026-01-22",
    )


# --------------------------------------------------
# BASIC SHAPE & KEYS
# --------------------------------------------------

def test_monte_carlo_output_structure():
    result = monte_carlo_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        horizon_days=30,
        n_sims=2_000,
        seed=42,
    )

    assert "assumptions" in result
    assert "summary" in result
    assert "percentiles" in result
    assert "tail_risk" in result


def test_required_percentiles_exist():
    result = monte_carlo_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        horizon_days=30,
        n_sims=2_000,
        seed=42,
    )

    percentiles = result["percentiles"]
    for k in ["p01", "p05", "p10", "p25", "p50", "p75", "p90", "p95", "p99"]:
        assert k in percentiles


# --------------------------------------------------
# MONOTONICITY & ORDERING
# --------------------------------------------------

def test_percentiles_are_ordered():
    result = monte_carlo_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        horizon_days=30,
        n_sims=5_000,
        seed=1,
    )

    p = result["percentiles"]

    assert p["p01"] <= p["p05"] <= p["p10"] <= p["p25"] <= p["p50"] \
           <= p["p75"] <= p["p90"] <= p["p95"] <= p["p99"]


def test_cvar_worse_than_var():
    result = monte_carlo_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        horizon_days=30,
        n_sims=5_000,
        seed=1,
    )

    tail = result["tail_risk"]

    assert tail["cvar_95"] <= tail["var_95"]
    assert tail["cvar_99"] <= tail["var_99"]


# --------------------------------------------------
# VOLATILITY EFFECT
# --------------------------------------------------

def test_higher_vol_increases_dispersion():
    low_vol = monte_carlo_scenario(
        make_strategy(),
        make_market(vol=0.15),
        TODAY,
        horizon_days=30,
        n_sims=5_000,
        seed=123,
    )

    high_vol = monte_carlo_scenario(
        make_strategy(),
        make_market(vol=0.60),
        TODAY,
        horizon_days=30,
        n_sims=5_000,
        seed=123,
    )

    assert high_vol["summary"]["std"] > low_vol["summary"]["std"]


# --------------------------------------------------
# HORIZON EFFECT
# --------------------------------------------------

def test_longer_horizon_increases_risk():
    short = monte_carlo_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        horizon_days=7,
        n_sims=5_000,
        seed=7,
    )

    long = monte_carlo_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        horizon_days=90,
        n_sims=5_000,
        seed=7,
    )

    assert abs(long["summary"]["std"]) > abs(short["summary"]["std"])


# --------------------------------------------------
# REPRODUCIBILITY
# --------------------------------------------------

def test_seed_reproducibility():
    r1 = monte_carlo_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        horizon_days=30,
        n_sims=2_000,
        seed=999,
    )

    r2 = monte_carlo_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        horizon_days=30,
        n_sims=2_000,
        seed=999,
    )

    assert r1["percentiles"] == r2["percentiles"]
