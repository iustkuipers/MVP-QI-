from abc import ABC, abstractmethod
from typing import List
import pandas as pd


class MarketDataProvider(ABC):
    """
    Abstract base class for all market data providers.

    Any provider (mock, yahoo, stooq, etc.) MUST implement
    the `load` method with this exact signature and behavior.
    """

    @abstractmethod
    def load(
        self,
        tickers: List[str],
        start_date: str,
        end_date: str,
    ) -> pd.DataFrame:
        """
        Load price data for given tickers and date range.

        Returns
        -------
        pd.DataFrame
            index   : DatetimeIndex (dates)
            columns : tickers
            values  : prices (float)

        Notes
        -----
        - No validation required here
        - No alignment required here
        - Loader will standardize and validate output
        """
        pass
