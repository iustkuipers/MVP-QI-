import json

from app.services.backtest_engine import run_backtest


with open("request_body.json", "r") as f:
    request_data = json.load(f)

result = run_backtest(request_data)

print("\n=== PORTFOLIO METRICS ===")
for k, v in result["portfolio_metrics"].items():
    print(f"{k}: {round(v, 4)}")

if result["benchmark_metrics"]:
    print("\n=== BENCHMARK METRICS ===")
    for k, v in result["benchmark_metrics"].items():
        print(f"{k}: {round(v, 4)}")
