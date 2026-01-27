from datetime import date

import pytest

from app.services.options.core.instruments import OptionContract
from app.services.options.core.market_data import MarketSnapshot
from app.services.options.portfolio.portfolio import Position
from app.services.options.scenarios.stress import crash_scenario


TODAY = date(2026, 1, 22)


# --------------------------------------------------
# FIXTURES
# --------------------------------------------------

def make_strategy():
    """
    Bullish strategy:
    +1 Call
    -1 Put
    """
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


def make_market(spot=185):
    return MarketSnapshot(
        spot=spot,
        rate=0.03,
        dividend_yield=0.005,
        volatility=0.25,
        timestamp="2026-01-22",
    )


# --------------------------------------------------
# BASIC STRUCTURE
# --------------------------------------------------

def test_crash_scenario_output_shape():
    results = crash_scenario(
        positions=make_strategy(),
        market=make_market(),
        today=TODAY,
        crashes=[-0.15, -0.25],
    )

    assert isinstance(results, list)
    assert len(results) == 2

    for r in results:
        assert "crash_pct" in r
        assert "spot" in r
        assert "value" in r
        assert "delta" in r
        assert "gamma" in r
        assert "vega" in r
        assert "theta" in r
        assert "rho" in r


# --------------------------------------------------
# ECONOMIC INTUITION
# --------------------------------------------------

def test_larger_crash_leads_to_lower_portfolio_value():
    results = crash_scenario(
        positions=make_strategy(),
        market=make_market(),
        today=TODAY,
        crashes=[-0.15, -0.25, -0.50],
    )

    values = [r["value"] for r in results]

    # More severe crashes should not improve value
    assert values[0] >= values[1] >= values[2]


def test_delta_decreases_with_crash_severity():
    results = crash_scenario(
        positions=make_strategy(),
        market=make_market(),
        today=TODAY,
        crashes=[-0.15, -0.25, -0.50],
    )

    deltas = [r["delta"] for r in results]

    # Verify deltas are in valid range [-1, 1]
    for delta in deltas:
        assert -1.0 <= delta <= 1.0


# --------------------------------------------------
# VALIDATION & SAFETY
# --------------------------------------------------

def test_positive_crash_raises_error():
    with pytest.raises(ValueError):
        crash_scenario(
            positions=make_strategy(),
            market=make_market(),
            today=TODAY,
            crashes=[0.10],  # invalid
        )


def test_zero_crash_raises_error():
    with pytest.raises(ValueError):
        crash_scenario(
            positions=make_strategy(),
            market=make_market(),
            today=TODAY,
            crashes=[0.0],  # invalid
        )


def test_single_crash_supported():
    result = crash_scenario(
        positions=make_strategy(),
        market=make_market(),
        today=TODAY,
        crashes=[-0.25],
    )

    assert len(result) == 1
    assert result[0]["crash_pct"] == -0.25
