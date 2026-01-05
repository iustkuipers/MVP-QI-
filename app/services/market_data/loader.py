import pandas as pd
from typing import List

from app.services.market_data.providers.mock import MockMarketDataProvider
# future:
# from app.services.market_data.providers.yahoo import YahooMarketDataProvider


def load_prices(
    tickers: List[str],
    start_date: str,
    end_date: str,
    provider: str = "mock",
) -> pd.DataFrame:
    """
    Load and standardize market prices.

    Returns
    -------
    pd.DataFrame
        index   : DatetimeIndex (business days)
        columns : tickers (same order as input)
        values  : float prices
    """

    # 1. Select provider
    if provider == "mock":
        provider_instance = MockMarketDataProvider()
    elif provider == "yahoo":
        raise NotImplementedError("Yahoo provider not implemented yet")
    else:
        raise ValueError(f"Unknown data provider: {provider}")

    # 2. Load raw prices from provider
    raw_prices = provider_instance.load(
        tickers=tickers,
        start_date=start_date,
        end_date=end_date,
    )

    # 3. Standardize output
    prices = _standardize_prices(raw_prices, tickers)

    # 4. Validate final contract
    _validate_prices(prices)

    return prices


def _standardize_prices(df: pd.DataFrame, tickers: List[str]) -> pd.DataFrame:
    """
    Enforce loader contract:
    - DatetimeIndex
    - Sorted index
    - Columns exactly match tickers (order preserved)
    """

    # Ensure DatetimeIndex
    if not isinstance(df.index, pd.DatetimeIndex):
        raise TypeError("Market data index must be a DatetimeIndex")

    # Sort by date
    df = df.sort_index()

    # Ensure required columns exist
    missing = set(tickers) - set(df.columns)
    if missing:
        raise ValueError(f"Missing tickers in data: {missing}")

    # Enforce column order
    df = df[tickers]

    df.index.name = "date"

    return df


def _validate_prices(df: pd.DataFrame):
    """
    Final hard guarantees to engine.
    """

    if df.empty:
        raise ValueError("No market data returned")

    if df.isnull().any().any():
        raise ValueError("Market data contains NaNs")

    if (df <= 0).any().any():
        raise ValueError("Market data contains non-positive prices")

    if not df.index.is_monotonic_increasing:
        raise ValueError("Market data index is not sorted")
