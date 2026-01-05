from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal


class PositionInput(BaseModel):
    ticker: str = Field(..., min_length=1)
    weight: float = Field(..., gt=0, le=1)


class BacktestRequest(BaseModel):
    start_date: str
    end_date: str
    initial_cash: float = Field(..., gt=0)

    positions: List[PositionInput]

    risk_free_rate: float = Field(..., ge=-0.5, le=1.0)
    benchmark_ticker: Optional[str] = None
    rebalance: Literal["none", "monthly", "daily"] = "none"

    # 👇 NEW
    data_provider: Literal["mock", "yahoo", "stooq"] = "mock"
    fractional_shares: bool = True
    compounding: bool = True

    @field_validator("positions")
    @classmethod
    def validate_weights(cls, positions):
        total_weight = sum(p.weight for p in positions)
        if total_weight > 1.0:
            raise ValueError(f"Sum of weights must be <= 1.0, got {total_weight}")
        return positions
