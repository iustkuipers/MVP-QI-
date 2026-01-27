from typing import Iterable, List, Dict
from datetime import date

from app.services.options.core.market_data import MarketSnapshot
from app.services.options.portfolio.portfolio import (
    Position,
    portfolio_price,
    portfolio_greeks,
)


def crash_scenario(
    positions: Iterable[Position],
    market: MarketSnapshot,
    today: date,
    *,
    crashes: List[float],
) -> List[Dict]:
    """
    Deterministic market crash stress test.

    Parameters
    ----------
    positions : Iterable[Position]
        Portfolio positions
    market : MarketSnapshot
        Current market state
    today : date
        Valuation date
    crashes : list of float
        Percentage crashes expressed as negative numbers.
        Example: [-0.15, -0.25, -0.50]

    Returns
    -------
    list of dict
        Stress scenario results per crash level
    """

    results = []

    for c in crashes:
        if c >= 0:
            raise ValueError("Crash percentages must be negative (e.g. -0.25 for -25%)")

        shocked_spot = market.spot * (1.0 + c)

        shocked_market = MarketSnapshot(
            spot=shocked_spot,
            rate=market.rate,
            dividend_yield=market.dividend_yield,
            volatility=market.volatility,  # flat vol assumption
            timestamp=market.timestamp,
        )

        value = portfolio_price(positions, shocked_market, today)
        g = portfolio_greeks(positions, shocked_market, today)

        results.append({
            "crash_pct": c,
            "spot": shocked_spot,
            "value": value,
            "delta": g["delta"],
            "gamma": g["gamma"],
            "vega": g["vega"],
            "theta": g["theta"],
            "rho": g["rho"],
        })

    return results
