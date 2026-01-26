from datetime import date

from core.instruments import OptionContract
from core.market_data import MarketSnapshot
from portfolio.portfolio import Position
from scenarios.scenarios import (
    spot_scenario,
    vol_scenario,
    time_scenario,
)


TODAY = date(2026, 1, 22)


# --------------------------------------------------
# FIXTURES
# --------------------------------------------------

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
# SPOT SCENARIO
# --------------------------------------------------

def test_spot_scenario_output_shape():
    results = spot_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        spots=[160, 180, 200],
    )

    assert isinstance(results, list)
    assert len(results) == 3

    for r in results:
        assert "spot" in r
        assert "value" in r
        assert "delta" in r
        assert "gamma" in r
        assert "vega" in r
        assert "theta" in r
        assert "rho" in r


def test_spot_scenario_value_monotonic_for_bullish_strategy():
    results = spot_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        spots=[150, 170, 190, 210],
    )

    values = [r["value"] for r in results]
    assert values == sorted(values)


def test_spot_scenario_delta_increases_with_spot():
    results = spot_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        spots=[150, 170, 190, 210],
    )

    deltas = [r["delta"] for r in results]
    assert deltas == sorted(deltas)


# --------------------------------------------------
# VOLATILITY SCENARIO
# --------------------------------------------------

def test_vol_scenario_output_shape():
    results = vol_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        vols=[0.1, 0.3, 0.6],
    )

    assert isinstance(results, list)
    assert len(results) == 3

    for r in results:
        assert "volatility" in r
        assert "value" in r
        assert "delta" in r
        assert "gamma" in r
        assert "vega" in r
        assert "theta" in r
        assert "rho" in r


def test_vol_scenario_value_increases_with_vol():
    results = vol_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        vols=[0.1, 0.3, 0.6],
    )

    values = [r["value"] for r in results]
    assert values[2] > values[0]


def test_vol_scenario_vega_positive():
    results = vol_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        vols=[0.2, 0.4],
    )

    for r in results:
        assert r["vega"] > 0.0


# --------------------------------------------------
# TIME SCENARIO
# --------------------------------------------------

def test_time_scenario_output_shape():
    results = time_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        days_forward=[0, 30, 60],
    )

    assert isinstance(results, list)
    assert len(results) == 3

    for r in results:
        assert "days_forward" in r
        assert "date" in r
        assert "value" in r
        assert "delta" in r
        assert "gamma" in r
        assert "vega" in r
        assert "theta" in r
        assert "rho" in r


def test_time_scenario_theta_decay_effect():
    results = time_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        days_forward=[0, 30],
    )

    # value should change due to theta (not necessarily monotonic)
    assert results[1]["value"] != results[0]["value"]


def test_time_scenario_gamma_decreases_near_expiry():
    results = time_scenario(
        make_strategy(),
        make_market(),
        TODAY,
        days_forward=[0, 120],
    )

    gamma_now = results[0]["gamma"]
    gamma_later = results[1]["gamma"]

    assert gamma_later <= gamma_now
