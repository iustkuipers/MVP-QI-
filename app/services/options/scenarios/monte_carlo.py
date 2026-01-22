from __future__ import annotations

import math
import numpy as np
from datetime import date, timedelta
from typing import Iterable, Dict, Optional

from app.services.options.core.market_data import MarketSnapshot
from app.services.options.portfolio.portfolio import (
    Position,
    portfolio_price,
)


# ============================================================
# Monte Carlo Scenario
# ============================================================

def monte_carlo_scenario(
    positions: Iterable[Position],
    market: MarketSnapshot,
    today: date,
    *,
    horizon_days: int,
    n_sims: int = 10_000,
    vol: Optional[float] = None,
    drift: Optional[float] = None,
    seed: Optional[int] = None,
    return_samples: bool = False,
) -> Dict:
    """
    Monte Carlo distribution of portfolio value at a future horizon.

    Underlying model:
        Geometric Brownian Motion (GBM)

        dS = μ S dt + σ S dW

    Parameters
    ----------
    positions : Iterable[Position]
        Portfolio positions
    market : MarketSnapshot
        Current market state
    today : date
        Valuation date
    horizon_days : int
        Simulation horizon in calendar days
    n_sims : int
        Number of Monte Carlo simulations
    vol : float, optional
        Volatility of underlying (defaults to market.volatility)
    drift : float, optional
        Drift of underlying (defaults to r - q)
    seed : int, optional
        Random seed for reproducibility
    return_samples : bool
        If True, return simulated terminal portfolio values

    Returns
    -------
    dict
        Summary statistics and tail risk metrics
    """

    if horizon_days <= 0:
        raise ValueError("horizon_days must be positive")

    if n_sims <= 0:
        raise ValueError("n_sims must be positive")

    sigma = vol if vol is not None else market.volatility
    if sigma <= 0:
        raise ValueError("volatility must be positive")

    mu = drift if drift is not None else (market.rate - market.dividend_yield)

    if seed is not None:
        np.random.seed(seed)

    # --------------------------------------------------------
    # Time handling
    # --------------------------------------------------------

    T = horizon_days / 365.0
    horizon_date = today + timedelta(days=horizon_days)

    S0 = market.spot

    # --------------------------------------------------------
    # Simulate terminal spot prices (GBM closed form)
    # --------------------------------------------------------

    Z = np.random.standard_normal(n_sims)

    ST = S0 * np.exp(
        (mu - 0.5 * sigma ** 2) * T
        + sigma * math.sqrt(T) * Z
    )

    # --------------------------------------------------------
    # Revalue portfolio at horizon
    # --------------------------------------------------------

    terminal_values = np.empty(n_sims)

    for i in range(n_sims):
        m = MarketSnapshot(
            spot=float(ST[i]),
            rate=market.rate,
            dividend_yield=market.dividend_yield,
            volatility=sigma,  # flat vol assumption
            timestamp=str(horizon_date),
        )

        terminal_values[i] = portfolio_price(
            positions,
            m,
            horizon_date,
        )

    # --------------------------------------------------------
    # Distribution statistics
    # --------------------------------------------------------

    percentiles = {
        "p01": float(np.percentile(terminal_values, 1)),
        "p05": float(np.percentile(terminal_values, 5)),
        "p10": float(np.percentile(terminal_values, 10)),
        "p25": float(np.percentile(terminal_values, 25)),
        "p50": float(np.percentile(terminal_values, 50)),
        "p75": float(np.percentile(terminal_values, 75)),
        "p90": float(np.percentile(terminal_values, 90)),
        "p95": float(np.percentile(terminal_values, 95)),
        "p99": float(np.percentile(terminal_values, 99)),
    }

    mean = float(np.mean(terminal_values))
    std = float(np.std(terminal_values))

    # --------------------------------------------------------
    # Tail risk metrics
    # --------------------------------------------------------

    var_95 = percentiles["p05"]
    var_99 = percentiles["p01"]

    cvar_95 = float(np.mean(terminal_values[terminal_values <= var_95]))
    cvar_99 = float(np.mean(terminal_values[terminal_values <= var_99]))

    # --------------------------------------------------------
    # Output (frontend-ready)
    # --------------------------------------------------------

    result = {
        "assumptions": {
            "model": "GBM",
            "spot": S0,
            "volatility": sigma,
            "drift": mu,
            "horizon_days": horizon_days,
            "n_simulations": n_sims,
            "risk_free_rate": market.rate,
            "dividend_yield": market.dividend_yield,
        },
        "summary": {
            "mean": mean,
            "std": std,
        },
        "percentiles": percentiles,
        "tail_risk": {
            "var_95": var_95,
            "var_99": var_99,
            "cvar_95": cvar_95,
            "cvar_99": cvar_99,
        },
    }

    if return_samples:
        result["samples"] = terminal_values.tolist()

    return result
