import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

from scenarios.stress import crash_scenario
from scenarios.monte_carlo import monte_carlo_scenario

from core.instruments import OptionContract
from core.market_data import MarketSnapshot
from portfolio.portfolio import (
    Position,
    portfolio_price,
    portfolio_greeks,
)

# =====================================================
# 1. MOCK FRONTEND INPUT (user strategy)
# =====================================================

SYMBOL = "AAPL"

call = OptionContract(
    symbol=SYMBOL,
    option_type="call",
    style="european",
    strike=160,
    expiry=datetime(2024, 6, 21).date(),
)

put = OptionContract(
    symbol=SYMBOL,
    option_type="put",
    style="european",
    strike=140,
    expiry=datetime(2024, 6, 21).date(),
)

positions = [
    Position(call, quantity=1.0),    # Buy call
    Position(put, quantity=1.0),    # Short put
]

# =====================================================
# 2. MARKET ASSUMPTIONS (backend defaults)
# =====================================================

RATE = 0.03
DIVIDEND_YIELD = 0.005
VOLATILITY = 0.25  # flat implied vol assumption

# =====================================================
# 3. LOAD PRICE DATA
# =====================================================

prices = pd.read_csv("prices.csv", parse_dates=["date"])
prices = prices[["date", SYMBOL]].rename(columns={SYMBOL: "spot"})

# =====================================================
# 4. PORTFOLIO REVALUATION OVER TIME
# =====================================================

records = []

for _, row in prices.iterrows():
    today = row["date"].date()
    spot = row["spot"]

    market = MarketSnapshot(
        spot=spot,
        rate=RATE,
        dividend_yield=DIVIDEND_YIELD,
        volatility=VOLATILITY,
        timestamp=str(today),
    )

    value = portfolio_price(positions, market, today)
    g = portfolio_greeks(positions, market, today)

    records.append({
        "date": today,
        "spot": spot,
        "portfolio_value": value,
        "delta": g["delta"],
        "gamma": g["gamma"],
        "vega": g["vega"],
        "theta": g["theta"],
        "rho": g["rho"],
    })

df = pd.DataFrame(records)

# =====================================================
# 5. SUMMARY METRICS (what frontend would show)
# =====================================================

summary = {
    "start_value": df["portfolio_value"].iloc[0],
    "end_value": df["portfolio_value"].iloc[-1],
    "total_pnl": df["portfolio_value"].iloc[-1] - df["portfolio_value"].iloc[0],
    "max_value": df["portfolio_value"].max(),
    "min_value": df["portfolio_value"].min(),
    "max_drawdown": (df["portfolio_value"] - df["portfolio_value"].cummax()).min(),
}

print("\n=== Portfolio Summary ===")
for k, v in summary.items():
    print(f"{k:15s}: {v: .4f}")

# =====================================================
# 6. VISUALIZATIONS (frontend-ready)
# =====================================================

# --- Spot ---
plt.figure()
plt.plot(df["date"], df["spot"])
plt.title("Underlying Spot Price")
plt.xlabel("Date")
plt.ylabel("Spot")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# --- Portfolio Value ---
plt.figure()
plt.plot(df["date"], df["portfolio_value"])
plt.title("Portfolio Value Over Time")
plt.xlabel("Date")
plt.ylabel("Value")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# --- Delta ---
plt.figure()
plt.plot(df["date"], df["delta"])
plt.title("Portfolio Delta Over Time")
plt.xlabel("Date")
plt.ylabel("Delta")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# --- Gamma ---
plt.figure()
plt.plot(df["date"], df["gamma"])
plt.title("Portfolio Gamma Over Time")
plt.xlabel("Date")
plt.ylabel("Gamma")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# --- Vega ---
plt.figure()
plt.plot(df["date"], df["vega"])
plt.title("Portfolio Vega Over Time")
plt.xlabel("Date")
plt.ylabel("Vega")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# --- Theta ---
plt.figure()
plt.plot(df["date"], df["theta"])
plt.title("Portfolio Theta (per day)")
plt.xlabel("Date")
plt.ylabel("Theta")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# =====================================================
# 7. EXPORT (frontend contract)
# =====================================================

df.to_csv("mock_frontend_timeseries.csv", index=False)


# =====================================================
# 8. CRASH STRESS SCENARIOS (deterministic)
# =====================================================

print("\n=== Crash Stress Scenarios ===")

crash_levels = [-0.15, -0.25, -0.50]

latest_row = df.iloc[-1]
latest_date = latest_row["date"]
latest_spot = latest_row["spot"]

latest_market = MarketSnapshot(
    spot=latest_spot,
    rate=RATE,
    dividend_yield=DIVIDEND_YIELD,
    volatility=VOLATILITY,
    timestamp=str(latest_date),
)

stress_results = crash_scenario(
    positions=positions,
    market=latest_market,
    today=latest_date,
    crashes=crash_levels,
)

stress_df = pd.DataFrame(stress_results)
print(stress_df[["crash_pct", "spot", "value", "delta"]])

# --- Bar chart: portfolio value under crashes ---
plt.figure()
plt.bar(
    [f"{int(c*100)}%" for c in stress_df["crash_pct"]],
    stress_df["value"],
)
plt.title("Portfolio Value Under Market Crashes")
plt.xlabel("Crash Size")
plt.ylabel("Portfolio Value")
plt.tight_layout()
plt.show()


# =====================================================
# 9. MONTE CARLO RISK SCENARIO (probabilistic)
# =====================================================

print("\n=== Monte Carlo Risk Scenario ===")

mc_result = monte_carlo_scenario(
    positions=positions,
    market=latest_market,
    today=latest_date,
    horizon_days=30,
    n_sims=10_000,
    seed=42,
    return_samples=True,
)

# --- Print key risk metrics ---
print("\nSummary:")
for k, v in mc_result["summary"].items():
    print(f"{k:10s}: {v: .4f}")

print("\nPercentiles:")
for k, v in mc_result["percentiles"].items():
    print(f"{k:5s}: {v: .4f}")

print("\nTail Risk:")
for k, v in mc_result["tail_risk"].items():
    print(f"{k:8s}: {v: .4f}")

# --- Histogram of outcomes ---
samples = mc_result["samples"]

plt.figure()
plt.hist(samples, bins=50, density=True)
plt.axvline(mc_result["percentiles"]["p05"], linestyle="--", label="5% VaR")
plt.axvline(mc_result["percentiles"]["p01"], linestyle="--", label="1% VaR")
plt.title("Monte Carlo Distribution of Portfolio Value (30d)")
plt.xlabel("Portfolio Value")
plt.ylabel("Density")
plt.legend()
plt.tight_layout()
plt.show()
