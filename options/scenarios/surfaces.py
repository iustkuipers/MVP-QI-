from typing import Iterable, List, Dict
from datetime import date, timedelta

from core.market_data import MarketSnapshot
from portfolio.portfolio import (
    Position,
    portfolio_price,
    portfolio_greeks,
)

# =====================================================
# Spot × Volatility Surface
# =====================================================

def spot_vol_surface(
    positions: Iterable[Position],
    market: MarketSnapshot,
    today: date,
    *,
    spots: List[float],
    vols: List[float],
) -> Dict:
    """
    Evaluate portfolio metrics on a Spot × Volatility grid.

    Rows correspond to spots
    Columns correspond to volatilities

    Returns frontend-ready surface data.
    """

    values = []
    delta = []
    gamma = []
    vega = []

    for s in spots:
        row_val = []
        row_delta = []
        row_gamma = []
        row_vega = []

        for v in vols:
            m = MarketSnapshot(
                spot=s,
                rate=market.rate,
                dividend_yield=market.dividend_yield,
                volatility=v,
                timestamp=market.timestamp,
            )

            row_val.append(portfolio_price(positions, m, today))

            g = portfolio_greeks(positions, m, today)
            row_delta.append(g["delta"])
            row_gamma.append(g["gamma"])
            row_vega.append(g["vega"])

        values.append(row_val)
        delta.append(row_delta)
        gamma.append(row_gamma)
        vega.append(row_vega)

    return {
        "spots": spots,
        "vols": vols,
        "value": values,
        "delta": delta,
        "gamma": gamma,
        "vega": vega,
    }


# =====================================================
# Spot × Time Surface
# =====================================================

def spot_time_surface(
    positions: Iterable[Position],
    market: MarketSnapshot,
    today: date,
    *,
    spots: List[float],
    days_forward: List[int],
) -> Dict:
    """
    Evaluate portfolio metrics on a Spot × Time grid.

    Rows correspond to spots
    Columns correspond to days forward
    """

    values = []
    delta = []
    gamma = []
    theta = []

    for s in spots:
        row_val = []
        row_delta = []
        row_gamma = []
        row_theta = []

        for d in days_forward:
            future_date = today + timedelta(days=d)

            m = MarketSnapshot(
                spot=s,
                rate=market.rate,
                dividend_yield=market.dividend_yield,
                volatility=market.volatility,
                timestamp=str(future_date),
            )

            row_val.append(portfolio_price(positions, m, future_date))

            g = portfolio_greeks(positions, m, future_date)
            row_delta.append(g["delta"])
            row_gamma.append(g["gamma"])
            row_theta.append(g["theta"])

        values.append(row_val)
        delta.append(row_delta)
        gamma.append(row_gamma)
        theta.append(row_theta)

    return {
        "spots": spots,
        "days_forward": days_forward,
        "value": values,
        "delta": delta,
        "gamma": gamma,
        "theta": theta,
    }
