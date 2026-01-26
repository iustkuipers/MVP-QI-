from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable, Dict

from core.instruments import OptionContract
from core.market_data import MarketSnapshot
from pricing.black_scholes import price as bs_price
from pricing.greeks import greeks as bs_greeks


@dataclass(frozen=True)
class Position:
    """
    A portfolio position in a single option contract.

    quantity convention:
    - positive = long
    - negative = short
    """
    contract: OptionContract
    quantity: float = 1.0


def position_price(pos: Position, market: MarketSnapshot, today: date) -> float:
    return pos.quantity * bs_price(pos.contract, market, today)


def position_greeks(pos: Position, market: MarketSnapshot, today: date) -> Dict[str, float]:
    g = bs_greeks(pos.contract, market, today)
    # scale greeks by position quantity
    return {
        "delta": pos.quantity * g["delta"],
        "gamma": pos.quantity * g["gamma"],
        "vega": pos.quantity * g["vega"],
        "theta": pos.quantity * g["theta"],
        "rho": pos.quantity * g["rho"],
    }


def portfolio_price(positions: Iterable[Position], market: MarketSnapshot, today: date) -> float:
    return sum(position_price(p, market, today) for p in positions)


def portfolio_greeks(positions: Iterable[Position], market: MarketSnapshot, today: date) -> Dict[str, float]:
    totals = {"delta": 0.0, "gamma": 0.0, "vega": 0.0, "theta": 0.0, "rho": 0.0}
    for p in positions:
        g = position_greeks(p, market, today)
        for k in totals:
            totals[k] += g[k]
    return totals


def delta_hedge_shares(positions: Iterable[Position], market: MarketSnapshot, today: date) -> float:
    """
    Shares of underlying needed to delta-hedge the portfolio.

    Convention:
    - underlying delta per share = +1
    - to hedge: shares = -portfolio_delta
    """
    d = portfolio_greeks(positions, market, today)["delta"]
    return -d
