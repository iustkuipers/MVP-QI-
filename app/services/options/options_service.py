"""
OptionsService orchestrator.

This module bridges the API layer and the options engine.
It hides engine complexity and provides a clean interface for backend operations.
"""

from datetime import date
from typing import Iterable, List, Dict, Optional

from app.services.options.core.instruments import OptionContract
from app.services.options.core.market_data import MarketSnapshot
from app.services.options.portfolio.portfolio import Position
from app.services.options.scenarios.monte_carlo import monte_carlo_scenario
from app.services.options.scenarios.stress import crash_scenario
from app.services.options.scenarios.surfaces import spot_vol_surface, spot_time_surface
from app.services.options.scenarios.scenarios import spot_scenario, vol_scenario, time_scenario


class OptionsService:
    """
    Orchestrator for the options pricing and risk engine.
    
    This class:
    - Hides engine implementation details
    - Provides stable API for backend routes
    - Handles conversion between JSON payloads and domain objects
    - Is easy to mock in tests
    """

    @staticmethod
    def parse_positions(positions_payload: List[Dict]) -> List[Position]:
        """
        Convert JSON positions to domain objects.
        
        Parameters
        ----------
        positions_payload : list of dict
            JSON positions from frontend/API
            
        Returns
        -------
        list of Position
            Domain model positions
        """
        positions = []
        for p in positions_payload:
            opt = OptionContract(
                symbol=p["symbol"],
                option_type=p["type"],  # "call" or "put"
                style=p.get("style", "european"),  # default to european
                strike=p["strike"],
                expiry=date.fromisoformat(p["expiry"]),
            )
            positions.append(Position(opt, p.get("quantity", 1.0)))
        return positions

    @staticmethod
    def parse_market(market_payload: Dict) -> MarketSnapshot:
        """
        Convert JSON market data to domain object.
        
        Parameters
        ----------
        market_payload : dict
            JSON market data from frontend/API
            
        Returns
        -------
        MarketSnapshot
            Domain model market snapshot
        """
        from datetime import datetime
        return MarketSnapshot(
            spot=market_payload["spot"],
            rate=market_payload["rate"],
            dividend_yield=market_payload.get("dividend_yield", 0.0),
            volatility=market_payload["volatility"],
            timestamp=market_payload.get("timestamp", datetime.now().isoformat()),
        )

    def run_monte_carlo(
        self,
        positions: List[Dict],
        market: Dict,
        today: date,
        horizon_days: int,
        n_sims: int = 10_000,
        vol: Optional[float] = None,
        drift: Optional[float] = None,
        seed: Optional[int] = None,
    ) -> Dict:
        """
        Run Monte Carlo scenario analysis.
        
        Parameters
        ----------
        positions : list of dict
            JSON option positions
        market : dict
            JSON market snapshot
        today : date
            Valuation date
        horizon_days : int
            Simulation horizon (days)
        n_sims : int
            Number of simulations
        vol : float, optional
            Override market volatility
        drift : float, optional
            Override drift calculation
        seed : int, optional
            Random seed for reproducibility
            
        Returns
        -------
        dict
            Monte Carlo results (percentiles, tail metrics, etc.)
        """
        domain_positions = self.parse_positions(positions)
        domain_market = self.parse_market(market)
        
        return monte_carlo_scenario(
            positions=domain_positions,
            market=domain_market,
            today=today,
            horizon_days=horizon_days,
            n_sims=n_sims,
            vol=vol,
            drift=drift,
            seed=seed,
        )

    def run_crash_scenario(
        self,
        positions: List[Dict],
        market: Dict,
        today: date,
        crashes: List[float],
    ) -> List[Dict]:
        """
        Run deterministic market crash scenarios.
        
        Parameters
        ----------
        positions : list of dict
            JSON option positions
        market : dict
            JSON market snapshot
        today : date
            Valuation date
        crashes : list of float
            Percentage crashes (negative, e.g., [-0.15, -0.25])
            
        Returns
        -------
        list of dict
            Results for each crash level
        """
        domain_positions = self.parse_positions(positions)
        domain_market = self.parse_market(market)
        
        return crash_scenario(
            positions=domain_positions,
            market=domain_market,
            today=today,
            crashes=crashes,
        )

    def run_spot_vol_surface(
        self,
        positions: List[Dict],
        market: Dict,
        today: date,
        spots: List[float],
        vols: List[float],
    ) -> Dict:
        """
        Evaluate portfolio on a spot × volatility surface.
        
        Parameters
        ----------
        positions : list of dict
            JSON option positions
        market : dict
            JSON market snapshot
        today : date
            Valuation date
        spots : list of float
            Spot prices to evaluate
        vols : list of float
            Volatilities to evaluate
            
        Returns
        -------
        dict
            Surface data (frontend-ready)
        """
        domain_positions = self.parse_positions(positions)
        domain_market = self.parse_market(market)
        
        return spot_vol_surface(
            positions=domain_positions,
            market=domain_market,
            today=today,
            spots=spots,
            vols=vols,
        )

    def run_spot_time_surface(
        self,
        positions: List[Dict],
        market: Dict,
        today: date,
        spots: List[float],
        horizons: List[int],
    ) -> Dict:
        """
        Evaluate portfolio on a spot × time surface.
        
        Parameters
        ----------
        positions : list of dict
            JSON option positions
        market : dict
            JSON market snapshot
        today : date
            Valuation date
        spots : list of float
            Spot prices to evaluate
        horizons : list of int
            Time horizons (days) to evaluate
            
        Returns
        -------
        dict
            Surface data (frontend-ready)
        """
        domain_positions = self.parse_positions(positions)
        domain_market = self.parse_market(market)
        
        return spot_time_surface(
            positions=domain_positions,
            market=domain_market,
            today=today,
            spots=spots,
            days_forward=horizons,
        )

    def run_spot_scenario(
        self,
        positions: List[Dict],
        market: Dict,
        today: date,
        spots: List[float],
    ) -> List[Dict]:
        """
        Run deterministic spot price scenarios.
        
        Parameters
        ----------
        positions : list of dict
            JSON option positions
        market : dict
            JSON market snapshot
        today : date
            Valuation date
        spots : list of float
            Spot prices to evaluate
            
        Returns
        -------
        list of dict
            Results for each spot level
        """
        domain_positions = self.parse_positions(positions)
        domain_market = self.parse_market(market)
        
        return spot_scenario(
            positions=domain_positions,
            market=domain_market,
            today=today,
            spots=spots,
        )

    def run_vol_scenario(
        self,
        positions: List[Dict],
        market: Dict,
        today: date,
        vols: List[float],
    ) -> List[Dict]:
        """
        Run deterministic volatility scenarios.
        
        Parameters
        ----------
        positions : list of dict
            JSON option positions
        market : dict
            JSON market snapshot
        today : date
            Valuation date
        vols : list of float
            Volatilities to evaluate
            
        Returns
        -------
        list of dict
            Results for each volatility level
        """
        domain_positions = self.parse_positions(positions)
        domain_market = self.parse_market(market)
        
        return vol_scenario(
            positions=domain_positions,
            market=domain_market,
            today=today,
            vols=vols,
        )

    def run_time_scenario(
        self,
        positions: List[Dict],
        market: Dict,
        today: date,
        horizons: List[int],
    ) -> List[Dict]:
        """
        Run deterministic time decay scenarios.
        
        Parameters
        ----------
        positions : list of dict
            JSON option positions
        market : dict
            JSON market snapshot
        today : date
            Valuation date
        horizons : list of int
            Time horizons (days) to evaluate
            
        Returns
        -------
        list of dict
            Results for each time horizon
        """
        domain_positions = self.parse_positions(positions)
        domain_market = self.parse_market(market)
        
        return time_scenario(
            positions=domain_positions,
            market=domain_market,
            today=today,
            days_forward=horizons,
        )
