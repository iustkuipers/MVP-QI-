"""
Strategy Timeline API Routes
"""

from fastapi import APIRouter, HTTPException
from app.api.schemas import StrategyTimelineRequest
from app.services.options.timeline import compute_strategy_timeline

router = APIRouter(prefix="/api/v1/strategy", tags=["strategy"])


@router.post("/timeline")
async def get_strategy_timeline(request: StrategyTimelineRequest):
    """
    Compute historical strategy timeline over date range.

    Returns:
        {
            "dates": [...],
            "underlying": [...],
            "portfolio_total": [...],
            "portfolio_options": [...],
            "instruments": {...},
            "markers": [...]
        }
    """
    try:
        result = compute_strategy_timeline(
            positions=[p.dict() for p in request.positions],
            market={
                "spot": request.market.spot,
                "rate": request.market.rate,
                "volatility": request.market.volatility,
                "dividend_yield": request.market.dividend_yield or 0.0,
            },
            symbol=request.symbol,
            start_date=request.start_date,
            end_date=request.end_date,
        )

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing strategy timeline: {str(e)}")
