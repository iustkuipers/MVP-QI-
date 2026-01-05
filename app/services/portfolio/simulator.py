from dataclasses import dataclass
from typing import Dict, List
import pandas as pd
import numpy as np


# ---------- Data structures ----------

@dataclass
class Trade:
    date: pd.Timestamp
    ticker: str
    quantity: float
    price: float
    side: str  # "BUY" or "SELL"


@dataclass
class PortfolioResult:
    nav: pd.Series
    equity_value: pd.Series
    cash: pd.Series
    positions: pd.DataFrame
    daily_returns: pd.Series
    trades: List[Trade]
    issues: List[str]


# ---------- Risk-free accrual helper ----------

def accrue_risk_free_cash(
    cash: pd.Series,
    annual_rate: float,
    compounding: str,
) -> pd.Series:
    """
    Apply risk-free accrual to a cash series.
    """

    if annual_rate == 0:
        return cash

    cash = cash.copy()

    if compounding == "daily":
        rate_per_step = annual_rate / 252
        for i in range(1, len(cash)):
            cash.iloc[i] = cash.iloc[i - 1] * (1 + rate_per_step)

    elif compounding == "quarterly":
        rate_per_step = annual_rate / 4
        for i in range(1, len(cash)):
            cash.iloc[i] = cash.iloc[i - 1]
            if cash.index[i].quarter != cash.index[i - 1].quarter:
                cash.iloc[i] *= (1 + rate_per_step)

    elif compounding == "yearly":
        rate_per_step = annual_rate
        for i in range(1, len(cash)):
            cash.iloc[i] = cash.iloc[i - 1]
            if cash.index[i].year != cash.index[i - 1].year:
                cash.iloc[i] *= (1 + rate_per_step)

    elif compounding == "continuous":
        dt = 1 / 252
        for i in range(1, len(cash)):
            cash.iloc[i] = cash.iloc[i - 1] * np.exp(annual_rate * dt)

    else:
        raise ValueError(
            "Invalid compounding type. "
            "Choose from: daily, quarterly, yearly, continuous."
        )

    return cash


# ---------- Simulator ----------

def simulate_portfolio(
    prices: pd.DataFrame,
    weights: Dict[str, float],
    initial_capital: float,
    allow_fractional_shares: bool = True,
    risk_free_rate: float = 0.0,
    risk_free_compounding: str = "daily",
    rebalance: str = "none",
) -> PortfolioResult:
    """
    Portfolio simulator with risk-free cash accrual.
    """

    issues: List[str] = []
    trades: List[Trade] = []

    # --- Validation ---
    if not set(weights.keys()).issubset(prices.columns):
        raise ValueError("Weights contain tickers not present in price data")

    if sum(weights.values()) > 1.0:
        raise ValueError("Sum of weights must be <= 1.0")

    if rebalance != "none":
        raise NotImplementedError("Only 'none' rebalance is supported")

    dates = prices.index
    first_date = dates[0]
    first_prices = prices.loc[first_date]

    # --- Initial allocation ---
    positions = {}
    remaining_cash = initial_capital

    for ticker, weight in weights.items():
        allocation = initial_capital * weight
        raw_qty = allocation / first_prices[ticker]
        qty = raw_qty if allow_fractional_shares else np.floor(raw_qty)

        spent = qty * first_prices[ticker]
        remaining_cash -= spent

        positions[ticker] = qty

        if qty > 0:
            trades.append(
                Trade(
                    date=first_date,
                    ticker=ticker,
                    quantity=qty,
                    price=first_prices[ticker],
                    side="BUY",
                )
            )

    # --- Positions over time (buy & hold) ---
    positions_df = pd.DataFrame(
        {ticker: qty for ticker, qty in positions.items()},
        index=dates,
    )

    # --- Equity value ---
    equity_value = (prices * positions_df).sum(axis=1)

    # --- Cash series (before accrual) ---
    cash_series = pd.Series(remaining_cash, index=dates)

    # --- Apply risk-free accrual ---
    cash_series = accrue_risk_free_cash(
        cash=cash_series,
        annual_rate=risk_free_rate,
        compounding=risk_free_compounding,
    )

    # --- NAV ---
    nav = equity_value + cash_series

    # --- Returns ---
    daily_returns = nav.pct_change().fillna(0.0)

    return PortfolioResult(
        nav=nav,
        equity_value=equity_value,
        cash=cash_series,
        positions=positions_df,
        daily_returns=daily_returns,
        trades=trades,
        issues=issues,
    )
