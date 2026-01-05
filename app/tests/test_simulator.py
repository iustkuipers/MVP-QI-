from app.services.market_data.loader import load_prices
from app.services.portfolio.simulator import simulate_portfolio


def test_simulator_fractional_vs_integer_with_risk_free():
    print("\n=== Loading mock prices ===")
    prices = load_prices(
        tickers=["AAPL", "MSFT", "IUST"],
        start_date="2020-01-01",
        end_date="2020-03-01",
        provider="mock",
    )

    initial_capital = 100_000
    weights = {
        "AAPL": 0.4,
        "MSFT": 0.4,
        "IUST": 0.1,
    }

    risk_free_rate = 0.03

    # ----------------------------
    # Case 1: Fractional shares + daily compounding
    # ----------------------------
    print("\n=== Test: Fractional shares + daily RF ===")
    result_fractional_daily = simulate_portfolio(
        prices=prices,
        weights=weights,
        initial_capital=initial_capital,
        allow_fractional_shares=True,
        risk_free_rate=risk_free_rate,
        risk_free_compounding="daily",
    )

    print("Initial NAV:", result_fractional_daily.nav.iloc[0])
    print("Final NAV:", result_fractional_daily.nav.iloc[-1])
    print("Final equity value:", result_fractional_daily.equity_value.iloc[-1])
    print("Final cash:", result_fractional_daily.cash.iloc[-1])

    assert abs(result_fractional_daily.nav.iloc[0] - initial_capital) < 1e-6
    assert result_fractional_daily.cash.iloc[-1] > result_fractional_daily.cash.iloc[0]

    # ----------------------------
    # Case 2: Integer shares + daily compounding
    # ----------------------------
    print("\n=== Test: Integer shares + daily RF ===")
    result_integer_daily = simulate_portfolio(
        prices=prices,
        weights=weights,
        initial_capital=initial_capital,
        allow_fractional_shares=False,
        risk_free_rate=risk_free_rate,
        risk_free_compounding="daily",
    )

    print("Final NAV:", result_integer_daily.nav.iloc[-1])
    print("Final cash:", result_integer_daily.cash.iloc[-1])

    assert result_integer_daily.cash.iloc[0] > 0
    assert result_integer_daily.cash.iloc[-1] > result_integer_daily.cash.iloc[0]

    # ----------------------------
    # Case 3: Continuous compounding (comparison)
    # ----------------------------
    print("\n=== Test: Fractional shares + continuous RF ===")
    result_fractional_continuous = simulate_portfolio(
        prices=prices,
        weights=weights,
        initial_capital=initial_capital,
        allow_fractional_shares=True,
        risk_free_rate=risk_free_rate,
        risk_free_compounding="continuous",
    )

    print("Final cash (daily):      ", result_fractional_daily.cash.iloc[-1])
    print("Final cash (continuous): ", result_fractional_continuous.cash.iloc[-1])

    assert (
        result_fractional_continuous.cash.iloc[-1]
        >= result_fractional_daily.cash.iloc[-1]
    )

    print("\nTest completed successfully.")


if __name__ == "__main__":
    test_simulator_fractional_vs_integer_with_risk_free()
