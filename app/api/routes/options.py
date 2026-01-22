"""
Options API routes.

These endpoints expose the options pricing and risk engine to the frontend.
Each endpoint:
1. Validates input (Pydantic)
2. Converts JSON to domain objects
3. Calls OptionsService
4. Returns JSON results
"""

from fastapi import APIRouter
from datetime import date

from app.api.schemas import (
    MonteCarloRequest,
    CrashScenarioRequest,
    SpotVolSurfaceRequest,
    SpotTimeSurfaceRequest,
    SpotScenarioRequest,
    VolScenarioRequest,
    TimeScenarioRequest,
)
from app.services.options.options_service import OptionsService

router = APIRouter(prefix="/api/v1/options", tags=["options"])
service = OptionsService()


@router.post("/monte-carlo")
def run_monte_carlo(request: MonteCarloRequest):
    """
    Run Monte Carlo scenario analysis.
    
    Simulates portfolio value distribution at a future horizon using GBM.
    
    Returns:
    - Percentiles (1st, 5th, 25th, 50th, 75th, 95th, 99th)
    - VaR and CVaR
    - Tail statistics
    """
    return service.run_monte_carlo(
        positions=[p.dict() for p in request.positions],
        market=request.market.dict(),
        today=date.fromisoformat(request.today),
        horizon_days=request.horizon_days,
        n_sims=request.n_sims,
        vol=request.vol,
        drift=request.drift,
        seed=request.seed,
    )


@router.post("/crash")
def run_crash(request: CrashScenarioRequest):
    """
    Run deterministic market crash scenarios.
    
    Evaluates portfolio under specified crash levels.
    
    Parameters:
    - crashes: List of negative percentages (e.g., [-0.15, -0.25, -0.50])
    
    Returns:
    - Portfolio value and Greeks for each crash level
    """
    return service.run_crash_scenario(
        positions=[p.dict() for p in request.positions],
        market=request.market.dict(),
        today=date.fromisoformat(request.today),
        crashes=request.crashes,
    )


@router.post("/spot-vol-surface")
def run_spot_vol_surface(request: SpotVolSurfaceRequest):
    """
    Evaluate portfolio on a Spot × Volatility surface.
    
    Returns a grid of portfolio values and Greeks.
    Frontend-ready for heatmap visualization.
    """
    return service.run_spot_vol_surface(
        positions=[p.dict() for p in request.positions],
        market=request.market.dict(),
        today=date.fromisoformat(request.today),
        spots=request.spots,
        vols=request.vols,
    )


@router.post("/spot-time-surface")
def run_spot_time_surface(request: SpotTimeSurfaceRequest):
    """
    Evaluate portfolio on a Spot × Time surface.
    
    Returns a grid of portfolio values and Greeks.
    Frontend-ready for heatmap visualization.
    """
    return service.run_spot_time_surface(
        positions=[p.dict() for p in request.positions],
        market=request.market.dict(),
        today=date.fromisoformat(request.today),
        spots=request.spots,
        horizons=request.horizons,
    )


@router.post("/spot-scenario")
def run_spot_scenario(request: SpotScenarioRequest):
    """
    Run deterministic spot price scenarios.
    
    Evaluates portfolio at different spot prices.
    Useful for P&L analysis.
    """
    return service.run_spot_scenario(
        positions=[p.dict() for p in request.positions],
        market=request.market.dict(),
        today=date.fromisoformat(request.today),
        spots=request.spots,
    )


@router.post("/vol-scenario")
def run_vol_scenario(request: VolScenarioRequest):
    """
    Run deterministic volatility scenarios.
    
    Evaluates portfolio at different volatility levels.
    Useful for vega analysis.
    """
    return service.run_vol_scenario(
        positions=[p.dict() for p in request.positions],
        market=request.market.dict(),
        today=date.fromisoformat(request.today),
        vols=request.vols,
    )


@router.post("/time-scenario")
def run_time_scenario(request: TimeScenarioRequest):
    """
    Run deterministic time decay scenarios.
    
    Evaluates portfolio at different time horizons.
    Useful for theta analysis.
    """
    return service.run_time_scenario(
        positions=[p.dict() for p in request.positions],
        market=request.market.dict(),
        today=date.fromisoformat(request.today),
        horizons=request.horizons,
    )
