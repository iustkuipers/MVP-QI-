from fastapi import APIRouter
from app.api.schemas import BacktestRequest
from app.services.backtest_engine import run_backtest

router = APIRouter(prefix="/api/v1", tags=["backtest"])


@router.post("/backtest")
def backtest(request: BacktestRequest):
    """
    Entry point for all backtests.
    Frontend intent stops here.
    Backend execution starts here.
    """
    result = run_backtest(request)
    return result
