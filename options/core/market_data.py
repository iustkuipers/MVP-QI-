from dataclasses import dataclass

@dataclass(frozen=True)
class MarketSnapshot:
    spot: float
    rate: float
    dividend_yield: float
    volatility: float
    timestamp: str
