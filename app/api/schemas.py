from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from datetime import date


class PositionInput(BaseModel):
    ticker: str = Field(..., min_length=1)
    weight: float = Field(..., gt=0, le=1)


class BacktestRequest(BaseModel):
    # --- Core parameters ---
    start_date: str
    end_date: str
    initial_cash: float = Field(..., gt=0)

    positions: List[PositionInput]

    # --- Risk-free assumptions ---
    risk_free_rate: float = Field(..., ge=-0.5, le=1.0)
    risk_free_compounding: Literal[
        "none",
        "daily",
        "monthly",
        "quarterly",
        "yearly",
        "continuous",
    ] = "none"

    # --- Benchmark & execution ---
    benchmark_ticker: Optional[str] = None
    rebalance: Literal["none"] = "none"

    # --- Execution options ---
    data_provider: Literal["mock", "yahoo", "stooq"] = "mock"
    fractional_shares: bool = True

    # --- Validation ---
    @field_validator("positions")
    @classmethod
    def validate_weights(cls, positions):
        total_weight = sum(p.weight for p in positions)
        if total_weight > 1.0:
            raise ValueError(
                f"Sum of weights must be <= 1.0, got {total_weight}"
            )
        return positions


# ============================================================
# OPTIONS SCHEMAS
# ============================================================


class OptionPositionInput(BaseModel):
    """Single option position in a portfolio."""
    symbol: str = Field(..., min_length=1, description="Underlying asset symbol")
    type: Literal["call", "put"] = Field(..., description="Option type")
    strike: float = Field(..., gt=0, description="Strike price")
    expiry: str = Field(..., description="Expiration date (ISO format: YYYY-MM-DD)")
    style: Literal["european", "american"] = Field(default="european", description="Option style")
    quantity: float = Field(default=1.0, description="Number of contracts")
    entry_price: Optional[float] = Field(default=None, ge=0, description="Premium paid/received at entry (optional)")
    entry_date: Optional[str] = Field(default=None, description="Entry date (ISO format: YYYY-MM-DD, optional)")


class MarketSnapshotInput(BaseModel):
    """Market snapshot for options pricing."""
    spot: float = Field(..., gt=0, description="Current spot price")
    rate: float = Field(..., ge=-0.5, le=1.0, description="Risk-free rate")
    dividend_yield: float = Field(default=0.0, ge=0, le=1.0, description="Dividend yield")
    volatility: float = Field(..., gt=0, le=3.0, description="Volatility (sigma)")


class MonteCarloRequest(BaseModel):
    """Monte Carlo scenario analysis request."""
    positions: List[OptionPositionInput]
    market: MarketSnapshotInput
    today: str = Field(..., description="Valuation date (ISO format: YYYY-MM-DD)")
    horizon_days: int = Field(..., gt=0, description="Simulation horizon (days)")
    n_sims: int = Field(default=10_000, gt=0, description="Number of simulations")
    vol: Optional[float] = Field(default=None, gt=0, description="Override volatility")
    drift: Optional[float] = Field(default=None, description="Override drift")
    seed: Optional[int] = Field(default=None, ge=0, description="Random seed")


class CrashScenarioRequest(BaseModel):
    """Crash scenario analysis request."""
    positions: List[OptionPositionInput]
    market: MarketSnapshotInput
    today: str = Field(..., description="Valuation date (ISO format: YYYY-MM-DD)")
    crashes: List[float] = Field(..., description="Crash percentages (negative, e.g., [-0.15, -0.25])")


class SpotVolSurfaceRequest(BaseModel):
    """Spot × Volatility surface request."""
    positions: List[OptionPositionInput]
    market: MarketSnapshotInput
    today: str = Field(..., description="Valuation date (ISO format: YYYY-MM-DD)")
    spots: List[float] = Field(..., min_length=1, description="Spot prices to evaluate")
    vols: List[float] = Field(..., min_length=1, description="Volatilities to evaluate")


class SpotTimeSurfaceRequest(BaseModel):
    """Spot × Time surface request."""
    positions: List[OptionPositionInput]
    market: MarketSnapshotInput
    today: str = Field(..., description="Valuation date (ISO format: YYYY-MM-DD)")
    spots: List[float] = Field(..., min_length=1, description="Spot prices to evaluate")
    horizons: List[int] = Field(..., min_length=1, description="Time horizons (days) to evaluate")


class SpotScenarioRequest(BaseModel):
    """Spot scenario analysis request."""
    positions: List[OptionPositionInput]
    market: MarketSnapshotInput
    today: str = Field(..., description="Valuation date (ISO format: YYYY-MM-DD)")
    spots: List[float] = Field(..., min_length=1, description="Spot prices to evaluate")


class VolScenarioRequest(BaseModel):
    """Volatility scenario analysis request."""
    positions: List[OptionPositionInput]
    market: MarketSnapshotInput
    today: str = Field(..., description="Valuation date (ISO format: YYYY-MM-DD)")
    vols: List[float] = Field(..., min_length=1, description="Volatilities to evaluate")


class TimeScenarioRequest(BaseModel):
    """Time decay scenario analysis request."""
    positions: List[OptionPositionInput]
    market: MarketSnapshotInput
    today: str = Field(..., description="Valuation date (ISO format: YYYY-MM-DD)")
    horizons: List[int] = Field(..., min_length=1, description="Time horizons (days) to evaluate")


class PayoffRequest(BaseModel):
    """Payoff curve analysis request."""
    positions: List[OptionPositionInput]
    market: MarketSnapshotInput
    today: str = Field(..., description="Valuation date (ISO format: YYYY-MM-DD)")
    expiry_date: str = Field(..., description="Option expiration date (ISO format: YYYY-MM-DD)")
    spot_center: float = Field(..., gt=0, description="Center spot for grid generation")
    pct_range: float = Field(default=0.5, gt=0, description="Range as percentage (e.g., 0.5 = ±50%)")
    n_points: int = Field(default=101, gt=1, description="Number of spot grid points")
    include_value_today: bool = Field(default=True, description="Include value at today")
    include_greeks_today: bool = Field(default=False, description="Include Greeks at today")

class StrategyTimelineRequest(BaseModel):
    """Strategy timeline analysis request."""
    positions: List[OptionPositionInput]
    market: MarketSnapshotInput
    symbol: str = Field(..., min_length=1, description="Underlying symbol (e.g., AAPL)")
    start_date: str = Field(..., description="Start date (ISO format: YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (ISO format: YYYY-MM-DD)")