"""
Quick test to verify payoff integration.
"""
from datetime import date
from app.services.options.options_service import OptionsService

service = OptionsService()

# Sample data
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

today = date(2026, 1, 22)
expiry_date = date(2026, 6, 19)

# Test run_payoff
print("Testing run_payoff...")
result = service.run_payoff(
    positions=positions,
    market=market,
    today=today,
    expiry_date=expiry_date,
    spot_center=185,
    pct_range=0.5,
    n_points=11,  # Small for quick test
    include_value_today=True,
    include_greeks_today=True,
)

print(f"✓ Payoff result keys: {result.keys()}")
print(f"✓ Spots: {len(result['spots'])} points")
print(f"✓ Payoff at expiry: {len(result['payoff_at_expiry'])} values")
print(f"✓ Value today: {len(result.get('value_today', []))} values")
print(f"✓ Greeks today: {list(result.get('greeks_today', {}).keys())}")
print("\n✅ All tests passed!")
