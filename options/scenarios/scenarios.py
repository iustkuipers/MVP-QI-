from datetime import date, timedelta
from typing import Iterable, List, Dict

from core.market_data import MarketSnapshot
from portfolio.portfolio import (
    Position,
    portfolio_price,
    portfolio_greeks,
)

# -------------------------------------------------
# SPOT SCENARIO
# -------------------------------------------------

def spot_scenario(
    positions: Iterable[Position],
    market: MarketSnapshot,
    today: date,
    spots: List[float],
) -> List[Dict]:
    """
    Portfolio value & greeks as function of spot.
    """
    results = []

    for s in spots:
        m = MarketSnapshot(
            spot=s,
            rate=market.rate,
            dividend_yield=market.dividend_yield,
            volatility=market.volatility,
            timestamp=market.timestamp,
        )

        results.append({
            "spot": s,
            "value": portfolio_price(positions, m, today),
            **portfolio_greeks(positions, m, today),
        })

    return results


# -------------------------------------------------
# VOLATILITY SCENARIO
# -------------------------------------------------

def vol_scenario(
    positions: Iterable[Position],
    market: MarketSnapshot,
    today: date,
    vols: List[float],
) -> List[Dict]:
    """
    Portfolio value & greeks as function of volatility.
    """
    results = []

    for v in vols:
        m = MarketSnapshot(
            spot=market.spot,
            rate=market.rate,
            dividend_yield=market.dividend_yield,
            volatility=v,
            timestamp=market.timestamp,
        )

        results.append({
            "volatility": v,
            "value": portfolio_price(positions, m, today),
            **portfolio_greeks(positions, m, today),
        })

    return results


# -------------------------------------------------
# TIME SCENARIO
# -------------------------------------------------

def time_scenario(
    positions: Iterable[Position],
    market: MarketSnapshot,
    today: date,
    days_forward: List[int],
) -> List[Dict]:
    """
    Portfolio value & greeks as time passes.
    """
    results = []

    for d in days_forward:
        t = today + timedelta(days=d)

        results.append({
            "days_forward": d,
            "date": t,
            "value": portfolio_price(positions, market, t),
            **portfolio_greeks(positions, market, t),
        })

    return results
