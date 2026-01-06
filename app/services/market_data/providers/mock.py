import numpy as np
import pandas as pd
from .base import MarketDataProvider


TICKER_CONFIG = {
    "AAPL": {"start": 150.0, "vol": 0.22},
    "MSFT": {"start": 300.0, "vol": 0.20},
    "VOO":  {"start": 400.0, "vol": 0.15},
    "SPY":  {"start": 450.0, "vol": 0.16},
    "QQQ":  {"start": 350.0, "vol": 0.25},
    "IVV":  {"start": 420.0, "vol": 0.14},
    "AGG":  {"start": 100.0, "vol": 0.05},
    "AEX":  {"start": 750.0, "vol": 0.18},
    "IUST": {"start": 25.0,  "vol": 0.35},
    "BND":  {"start": 80.0,  "vol": 0.06},
    "VTI":  {"start": 210.0, "vol": 0.16},
}


class MockMarketDataProvider(MarketDataProvider):
    """
    Deterministic geometric Brownian motion price simulator.
    """

    def load(self, tickers, start_date, end_date) -> pd.DataFrame:
        dates = pd.date_range(start=start_date, end=end_date, freq="B")
        n = len(dates)

        rng = np.random.default_rng(seed=42)  # 🔒 deterministic

        data = {}

        for ticker in tickers:
            if ticker not in TICKER_CONFIG:
                raise ValueError(f"Mock provider does not support ticker: {ticker}")

            cfg = TICKER_CONFIG[ticker]

            start_price = cfg["start"]
            annual_vol = cfg["vol"]
            daily_vol = annual_vol / np.sqrt(252)
            daily_drift = 0.05 / 252  # modest positive drift

            # random walk (log returns)
            shocks = rng.normal(
                loc=daily_drift,
                scale=daily_vol,
                size=n,
            )

            prices = start_price * np.exp(np.cumsum(shocks))
            data[ticker] = prices

        df = pd.DataFrame(data, index=dates)
        df.index.name = "date"

        return df

    
