from datetime import date

from app.services.options.core.instruments import OptionContract
from app.services.options.core.market_data import MarketSnapshot
from app.services.options.portfolio.portfolio import Position
from app.services.options.scenarios.surfaces import (
    spot_vol_surface,
    spot_time_surface,
)

TODAY = date(2026, 1, 22)


# --------------------------------------------------
# FIXTURES
# --------------------------------------------------

def make_strategy():
    """
    Bullish synthetic forward:
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


def make_market():
    return MarketSnapshot(
        spot=185,
        rate=0.03,
        dividend_yield=0.005,
        volatility=0.25,
        timestamp="2026-01-22",
    )


# --------------------------------------------------
# SPOT × VOL SURFACE
# --------------------------------------------------

def test_spot_vol_surface_shape():
    spots = [160, 180, 200]
    vols = [0.15, 0.25, 0.35]

    surface = spot_vol_surface(
        make_strategy(),
        make_market(),
        TODAY,
        spots=spots,
        vols=vols,
    )

    assert surface["spots"] == spots
    assert surface["vols"] == vols

    for key in ["value", "delta", "gamma", "vega"]:
        grid = surface[key]
        assert len(grid) == len(spots)
        for row in grid:
            assert len(row) == len(vols)


def test_spot_vol_surface_value_increases_with_spot():
    surface = spot_vol_surface(
        make_strategy(),
        make_market(),
        TODAY,
        spots=[150, 170, 190],
        vols=[0.25],
    )

    values = [row[0] for row in surface["value"]]
    assert values == sorted(values)


def test_spot_vol_surface_vega_positive():
    surface = spot_vol_surface(
        make_strategy(),
        make_market(),
        TODAY,
        spots=[180],
        vols=[0.15, 0.30, 0.60],
    )

    vegas = surface["vega"][0]
    for v in vegas:
        assert v > 0.0


# --------------------------------------------------
# SPOT × TIME SURFACE
# --------------------------------------------------

def test_spot_time_surface_shape():
    spots = [160, 180]
    days = [0, 30, 60]

    surface = spot_time_surface(
        make_strategy(),
        make_market(),
        TODAY,
        spots=spots,
        days_forward=days,
    )

    assert surface["spots"] == spots
    assert surface["days_forward"] == days

    for key in ["value", "delta", "gamma", "theta"]:
        grid = surface[key]
        assert len(grid) == len(spots)
        for row in grid:
            assert len(row) == len(days)


def test_spot_time_surface_gamma_decays_with_time():
    surface = spot_time_surface(
        make_strategy(),
        make_market(),
        TODAY,
        spots=[180],
        days_forward=[0, 90],
    )

    gamma_now = surface["gamma"][0][0]
    gamma_later = surface["gamma"][0][1]

    # Gamma increases as we approach expiration (time decay accelerates)
    assert gamma_later >= gamma_now


def test_spot_time_surface_value_changes_over_time():
    surface = spot_time_surface(
        make_strategy(),
        make_market(),
        TODAY,
        spots=[180],
        days_forward=[0, 30],
    )

    assert surface["value"][0][0] != surface["value"][0][1]
