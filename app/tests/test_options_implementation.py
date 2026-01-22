"""
Comprehensive test suite for Options Implementation

Tests all endpoints and functionality to verify correct integration of:
- OptionsService orchestrator
- API schemas and routes
- Domain model conversions
- Scenario calculations
"""

import pytest
from datetime import date

from app.services.options.options_service import OptionsService
from app.api.schemas import (
    OptionPositionInput,
    MarketSnapshotInput,
    MonteCarloRequest,
)


# ============================================================
# FIXTURES
# ============================================================

@pytest.fixture
def service():
    """OptionsService instance."""
    return OptionsService()


@pytest.fixture
def sample_market():
    """Sample market snapshot."""
    return {
        "spot": 185.0,
        "rate": 0.03,
        "dividend_yield": 0.005,
        "volatility": 0.25,
    }


@pytest.fixture
def sample_call():
    """Sample call option."""
    return {
        "symbol": "AAPL",
        "type": "call",
        "strike": 180.0,
        "expiry": "2026-06-19",
        "style": "european",
        "quantity": 1.0,
    }


@pytest.fixture
def sample_put():
    """Sample put option."""
    return {
        "symbol": "AAPL",
        "type": "put",
        "strike": 180.0,
        "expiry": "2026-06-19",
        "style": "european",
        "quantity": 1.0,
    }


@pytest.fixture
def today():
    """Valuation date."""
    return date(2026, 1, 22)


# ============================================================
# TEST: Core Functionality - All Imports Work
# ============================================================

def test_imports_options_service():
    """Verify OptionsService can be imported."""
    from app.services.options.options_service import OptionsService
    assert OptionsService is not None


def test_imports_api_schemas():
    """Verify API schemas can be imported."""
    from app.api.schemas import MonteCarloRequest, CrashScenarioRequest
    assert MonteCarloRequest is not None
    assert CrashScenarioRequest is not None


def test_imports_api_routes():
    """Verify API routes can be imported."""
    from app.api.routes.options import router
    assert router is not None


def test_imports_engine():
    """Verify options engine modules can be imported."""
    from app.services.options.scenarios.monte_carlo import monte_carlo_scenario
    from app.services.options.scenarios.stress import crash_scenario
    from app.services.options.pricing.black_scholes import price
    assert monte_carlo_scenario is not None
    assert crash_scenario is not None
    assert price is not None


# ============================================================
# TEST: Parsing - JSON to Domain Objects
# ============================================================

def test_parse_positions(service, sample_call):
    """Test JSON position parsing."""
    positions = service.parse_positions([sample_call])
    assert len(positions) == 1
    assert positions[0].contract.symbol == "AAPL"
    assert positions[0].contract.option_type == "call"
    assert positions[0].quantity == 1.0


def test_parse_market(service, sample_market):
    """Test JSON market parsing."""
    market = service.parse_market(sample_market)
    assert market.spot == 185.0
    assert market.rate == 0.03
    assert market.volatility == 0.25
    assert market.dividend_yield == 0.005


def test_parse_market_default_dividend(service):
    """Test market parsing with default dividend."""
    market_data = {"spot": 100.0, "rate": 0.02, "volatility": 0.20}
    market = service.parse_market(market_data)
    assert market.dividend_yield == 0.0


# ============================================================
# TEST: Monte Carlo Scenario
# ============================================================

def test_monte_carlo_basic(service, sample_call, sample_market, today):
    """Test basic Monte Carlo calculation."""
    result = service.run_monte_carlo(
        positions=[sample_call],
        market=sample_market,
        today=today,
        horizon_days=30,
        n_sims=500,
        seed=42,
    )
    
    assert "summary" in result
    assert "percentiles" in result
    assert "tail_risk" in result
    assert result["summary"]["mean"] > 0


def test_monte_carlo_reproducible(service, sample_call, sample_market, today):
    """Test Monte Carlo reproducibility with same seed."""
    r1 = service.run_monte_carlo(
        positions=[sample_call],
        market=sample_market,
        today=today,
        horizon_days=30,
        n_sims=100,
        seed=99,
    )
    
    r2 = service.run_monte_carlo(
        positions=[sample_call],
        market=sample_market,
        today=today,
        horizon_days=30,
        n_sims=100,
        seed=99,
    )
    
    assert r1["summary"]["mean"] == r2["summary"]["mean"]


def test_monte_carlo_portfolio(service, sample_call, sample_put, sample_market, today):
    """Test Monte Carlo with multiple positions."""
    result = service.run_monte_carlo(
        positions=[sample_call, sample_put],
        market=sample_market,
        today=today,
        horizon_days=30,
        n_sims=200,
        seed=42,
    )
    
    assert "summary" in result
    assert result["summary"]["mean"] > 0


# ============================================================
# TEST: Crash Scenario
# ============================================================

def test_crash_scenario(service, sample_call, sample_market, today):
    """Test crash scenario analysis."""
    result = service.run_crash_scenario(
        positions=[sample_call],
        market=sample_market,
        today=today,
        crashes=[-0.15, -0.25],
    )
    
    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["crash_pct"] == -0.15
    assert result[1]["crash_pct"] == -0.25
    assert "delta" in result[0]
    assert "gamma" in result[0]


# ============================================================
# TEST: Spot Vol Surface
# ============================================================

def test_spot_vol_surface(service, sample_call, sample_market, today):
    """Test spot × vol surface."""
    result = service.run_spot_vol_surface(
        positions=[sample_call],
        market=sample_market,
        today=today,
        spots=[150, 185, 220],
        vols=[0.20, 0.25, 0.30],
    )
    
    assert isinstance(result, dict)
    assert "value" in result
    assert "delta" in result
    assert "gamma" in result
    assert len(result["value"]) == 3  # 3 spots
    assert len(result["value"][0]) == 3  # 3 vols


# ============================================================
# TEST: Spot Scenario
# ============================================================

def test_spot_scenario(service, sample_call, sample_market, today):
    """Test spot scenario analysis."""
    result = service.run_spot_scenario(
        positions=[sample_call],
        market=sample_market,
        today=today,
        spots=[150, 185, 220],
    )
    
    assert isinstance(result, list)
    assert len(result) == 3
    assert result[0]["spot"] == 150
    assert result[1]["spot"] == 185
    assert result[2]["spot"] == 220
    assert all("delta" in r for r in result)


# ============================================================
# TEST: Vol Scenario
# ============================================================

def test_vol_scenario(service, sample_call, sample_market, today):
    """Test volatility scenario analysis."""
    result = service.run_vol_scenario(
        positions=[sample_call],
        market=sample_market,
        today=today,
        vols=[0.20, 0.25, 0.30],
    )
    
    assert isinstance(result, list)
    assert len(result) == 3
    assert all("vega" in r for r in result)
    assert all("value" in r for r in result)


# ============================================================
# TEST: Time Scenario
# ============================================================

def test_time_scenario(service, sample_call, sample_market, today):
    """Test time decay scenario analysis."""
    result = service.run_time_scenario(
        positions=[sample_call],
        market=sample_market,
        today=today,
        horizons=[1, 10, 20],
    )
    
    assert isinstance(result, list)
    assert len(result) == 3
    assert all("theta" in r for r in result)
    assert all("days_forward" in r for r in result)


# ============================================================
# TEST: Spot Time Surface
# ============================================================

def test_spot_time_surface(service, sample_call, sample_market, today):
    """Test spot × time surface."""
    result = service.run_spot_time_surface(
        positions=[sample_call],
        market=sample_market,
        today=today,
        spots=[150, 185, 220],
        horizons=[5, 15, 30],
    )
    
    assert isinstance(result, dict)
    assert "value" in result
    assert len(result["value"]) == 3
    assert len(result["value"][0]) == 3


# ============================================================
# TEST: Pydantic Schemas
# ============================================================

def test_schema_option_position():
    """Test OptionPositionInput schema."""
    data = {
        "symbol": "AAPL",
        "type": "call",
        "strike": 180.0,
        "expiry": "2026-06-19",
    }
    pos = OptionPositionInput(**data)
    assert pos.symbol == "AAPL"
    assert pos.type == "call"


def test_schema_market_snapshot():
    """Test MarketSnapshotInput schema."""
    data = {
        "spot": 185.0,
        "rate": 0.03,
        "volatility": 0.25,
    }
    market = MarketSnapshotInput(**data)
    assert market.spot == 185.0
    assert market.dividend_yield == 0.0


def test_schema_monte_carlo_request(sample_call, sample_market):
    """Test MonteCarloRequest schema."""
    data = {
        "positions": [sample_call],
        "market": sample_market,
        "today": "2026-01-22",
        "horizon_days": 30,
    }
    req = MonteCarloRequest(**data)
    assert req.horizon_days == 30
    assert req.n_sims == 10_000  # default


# ============================================================
# TEST: End-to-End Integration
# ============================================================

def test_end_to_end_call(today):
    """End-to-end: single call analysis."""
    service = OptionsService()
    
    positions = [{
        "symbol": "AAPL",
        "type": "call",
        "strike": 180.0,
        "expiry": "2026-06-19",
        "quantity": 1.0,
    }]
    
    market = {
        "spot": 185.0,
        "rate": 0.03,
        "dividend_yield": 0.005,
        "volatility": 0.25,
    }
    
    # Run multiple scenarios
    mc = service.run_monte_carlo(positions, market, today, 30, 300, seed=42)
    crash = service.run_crash_scenario(positions, market, today, [-0.15])
    spot = service.run_spot_scenario(positions, market, today, [150, 185, 220])
    
    assert mc["summary"]["mean"] > 0
    assert len(crash) == 1
    assert len(spot) == 3


def test_end_to_end_spread(today):
    """End-to-end: bull call spread analysis."""
    service = OptionsService()
    
    positions = [
        {
            "symbol": "AAPL",
            "type": "call",
            "strike": 180.0,
            "expiry": "2026-06-19",
            "quantity": 1.0,
        },
        {
            "symbol": "AAPL",
            "type": "call",
            "strike": 200.0,
            "expiry": "2026-06-19",
            "quantity": -1.0,
        },
    ]
    
    market = {
        "spot": 185.0,
        "rate": 0.03,
        "dividend_yield": 0.005,
        "volatility": 0.25,
    }
    
    result = service.run_spot_scenario(positions, market, today, [150, 180, 200, 220])
    
    assert len(result) == 4
    # Bull spread has increasing delta as spot increases
    assert result[0]["delta"] < result[-1]["delta"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
