from app.services.market_data.loader import load_prices

prices = load_prices(
    tickers=["AAPL", "MSFT", "VOO", "IUST"],
    start_date="2020-01-01",
    end_date="2020-03-01",
    provider="mock",
)

print(prices.head())
