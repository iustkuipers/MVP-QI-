from datetime import date
from core.instruments import OptionContract
from core.market_data import MarketSnapshot 

if __name__ == "__main__":
    option = OptionContract(
        symbol="AAPL",
        option_type="call",
        style="european",
        strike=180,
        expiry=date(2026, 6, 19),
        quantity=1
    )

    market = MarketSnapshot(
        spot=185,
        rate=0.03,
        dividend_yield=0.005,
        volatility=0.25,
        timestamp="2026-01-22"
    )

    print(option)
    print(market)
