from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable, List, Dict, Optional

from app.services.options.core.market_data import MarketSnapshot
from app.services.options.portfolio.portfolio import Position, portfolio_price, portfolio_greeks


@dataclass(frozen=True)
class PayoffConfig:
    """
    Configuration for payoff / value curves.

    Notes:
    - 'expiry_date' defines the date at which we compute the payoff curve.
    - If include_value_today=True, we also compute a 'value_today' curve on the same spot grid.
    - Volatility is taken from the provided 'market' snapshot (flat vol assumption).
    """
    expiry_date: date
    spots: List[float]
    include_value_today: bool = True
    include_greeks_today: bool = False  # optional: delta/gamma/vega/theta at today along the spot grid


def payoff_scenario(
    positions: Iterable[Position],
    market: MarketSnapshot,
    today: date,
    *,
    config: PayoffConfig,
) -> Dict:
    """
    Build payoff/value curves for a portfolio of options.

    Outputs are frontend-ready arrays aligned to the same 'spots' axis.

    Returns
    -------
    dict with keys:
      - spots: list[float]
      - payoff_at_expiry: list[float]  (portfolio value when valued on expiry_date)
      - value_today: list[float]       (optional, if include_value_today=True)
      - greeks_today: dict[str, list[float]] (optional, if include_greeks_today=True)
      - metadata: assumptions & dates
    """

    if not config.spots:
        raise ValueError("config.spots must be a non-empty list of spot values")

    # Sort spots for nicer curves + consistent UI
    spots = sorted(float(s) for s in config.spots)

    # --- Payoff at expiry (portfolio valued at expiry_date)
    payoff_at_expiry: List[float] = []
    for s in spots:
        m_exp = MarketSnapshot(
            spot=s,
            rate=market.rate,
            dividend_yield=market.dividend_yield,
            volatility=market.volatility,
            timestamp=str(config.expiry_date),
        )
        payoff_at_expiry.append(portfolio_price(positions, m_exp, config.expiry_date))

    result: Dict = {
        "spots": spots,
        "payoff_at_expiry": payoff_at_expiry,
        "metadata": {
            "today": str(today),
            "expiry_date": str(config.expiry_date),
            "assumptions": {
                "rate": market.rate,
                "dividend_yield": market.dividend_yield,
                "volatility": market.volatility,
                "vol_model": "flat",
            },
        },
    }

    # --- Optional: value curve today (same spot grid, valued at 'today')
    if config.include_value_today:
        value_today: List[float] = []
        for s in spots:
            m_today = MarketSnapshot(
                spot=s,
                rate=market.rate,
                dividend_yield=market.dividend_yield,
                volatility=market.volatility,
                timestamp=str(today),
            )
            value_today.append(portfolio_price(positions, m_today, today))
        result["value_today"] = value_today

    # --- Optional: Greeks today along the grid (useful for “risk along payoff” visualization)
    if config.include_greeks_today:
        deltas: List[float] = []
        gammas: List[float] = []
        vegas: List[float] = []
        thetas: List[float] = []
        rhos: List[float] = []

        for s in spots:
            m_today = MarketSnapshot(
                spot=s,
                rate=market.rate,
                dividend_yield=market.dividend_yield,
                volatility=market.volatility,
                timestamp=str(today),
            )
            g = portfolio_greeks(positions, m_today, today)
            deltas.append(g["delta"])
            gammas.append(g["gamma"])
            vegas.append(g["vega"])
            thetas.append(g["theta"])
            rhos.append(g["rho"])

        result["greeks_today"] = {
            "delta": deltas,
            "gamma": gammas,
            "vega": vegas,
            "theta": thetas,
            "rho": rhos,
        }

    return result


def make_spot_grid(
    spot_center: float,
    *,
    pct_range: float = 0.5,
    n: int = 101,
    min_spot: float = 0.01,
) -> List[float]:
    """
    Convenience helper for building a spot grid around current spot.

    Example:
      spot_center=185, pct_range=0.5 -> spots from 92.5 to 277.5 (approx)

    Parameters
    ----------
    spot_center : float
        Current spot price
    pct_range : float
        Range on each side in percentage terms (0.5 means +/- 50%)
    n : int
        Number of grid points
    min_spot : float
        Lower bound to avoid zero/negative spots

    Returns
    -------
    list[float]
    """
    if spot_center <= 0:
        raise ValueError("spot_center must be > 0")
    if pct_range <= 0:
        raise ValueError("pct_range must be > 0")
    if n < 2:
        raise ValueError("n must be >= 2")

    lo = max(min_spot, spot_center * (1.0 - pct_range))
    hi = spot_center * (1.0 + pct_range)

    step = (hi - lo) / (n - 1)
    return [lo + i * step for i in range(n)]
