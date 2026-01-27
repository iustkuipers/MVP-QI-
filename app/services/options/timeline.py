"""
Strategy Timeline Service - Compute historical portfolio values over time
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List
from app.services.market_data.loader import load_prices
from app.services.options.pricing.black_scholes import price as black_scholes_price
from app.services.options.core.instruments import OptionContract
from app.services.options.core.market_data import MarketSnapshot as CoreMarketSnapshot


def compute_strategy_timeline(
    positions: List[Dict[str, Any]],
    market: Dict[str, float],
    symbol: str,
    start_date: str,
    end_date: str,
) -> Dict[str, Any]:
    """
    Compute historical portfolio values over time.

    Args:
        positions: List of option/stock positions
        market: Market snapshot (spot, rate, volatility, dividend_yield)
        symbol: Underlying symbol (e.g., "AAPL")
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)

    Returns:
        Dictionary with dates, values, instruments, and markers
    """

    # Load historical prices
    try:
        # Call load_prices with correct parameters (tickers, start_date, end_date)
        prices_df = load_prices(
            tickers=[symbol],
            start_date=start_date,
            end_date=end_date,
            provider="mock"
        )
        
        if prices_df is None or len(prices_df) == 0:
            return {
                "dates": [],
                "underlying": [],
                "portfolio_total": [],
                "portfolio_options": [],
                "instruments": {},
                "markers": [],
                "error": f"No price data for {symbol}",
            }
        
        # Convert DataFrame to list of dicts
        dates = [d.strftime("%Y-%m-%d") for d in prices_df.index]
        spot_prices = {d: float(prices_df.loc[d, symbol]) for d in dates}
    
    except Exception as e:
        return {
            "dates": [],
            "underlying": [],
            "portfolio_total": [],
            "portfolio_options": [],
            "instruments": {},
            "markers": [],
            "error": f"Could not load prices: {str(e)}",
        }

    # Parse positions into OptionContract objects and track entry dates
    option_contracts = []
    option_entry_dates = []
    stocks = {}

    for pos in positions:
        if pos.get("type") in ["call", "put"]:
            # It's an option - create OptionContract
            expiry_date = datetime.strptime(pos.get("expiry"), "%Y-%m-%d").date()
            opt_contract = OptionContract(
                symbol=pos.get("symbol", symbol),
                option_type=pos["type"],
                style="european",
                strike=pos.get("strike"),
                expiry=expiry_date,
                quantity=pos.get("quantity", 1),
            )
            option_contracts.append(opt_contract)
            option_entry_dates.append(pos.get("entry_date"))
        else:
            # It's a stock position
            stocks[pos.get("symbol", symbol)] = pos.get("quantity", 1)

    # Compute timeline
    timeline_data = []
    instruments_timeline = {f"opt_{i}": [] for i in range(len(option_contracts))}
    if stocks:
        instruments_timeline["stock"] = []

    # Calculate initial cost of portfolio for buy-and-hold comparison
    initial_spot = spot_prices.get(dates[0], market["spot"]) if dates else market["spot"]
    initial_cost = 0.0  # Net cost (positive = we paid, negative = we received)
    
    for pos in positions:
        if pos.get("type") in ["call", "put"]:
            # Use provided entry_price if available, otherwise calculate with Black-Scholes
            if pos.get("entry_price") is not None:
                # User provided the actual premium they paid/received
                initial_cost += pos.get("entry_price", 0.0) * pos.get("quantity", 1)
            else:
                # Calculate initial option cost using Black-Scholes
                expiry_date = datetime.strptime(pos.get("expiry"), "%Y-%m-%d").date()
                opt_contract = OptionContract(
                    symbol=pos.get("symbol", symbol),
                    option_type=pos["type"],
                    style="european",
                    strike=pos.get("strike"),
                    expiry=expiry_date,
                    quantity=1,  # Use quantity=1 for pricing, multiply later
                )
                market_snapshot = CoreMarketSnapshot(
                    spot=initial_spot,
                    rate=market.get("rate", 0.03),
                    volatility=market.get("volatility", 0.25),
                    dividend_yield=market.get("dividend_yield", 0),
                    timestamp=dates[0] if dates else "2026-01-22",
                )
                try:
                    price = black_scholes_price(
                        option=opt_contract,
                        market=market_snapshot,
                        today=datetime.strptime(dates[0], "%Y-%m-%d").date() if dates else datetime.now().date(),
                    )
                    # Multiply by quantity: positive quantity = long (we pay), negative = short (we receive)
                    initial_cost += price * pos.get("quantity", 1)
                except:
                    pass
        else:
            # It's a stock - add to initial cost
            initial_cost += initial_spot * pos.get("quantity", 1)

    for date_str in dates:
        spot = spot_prices.get(date_str, market["spot"])
        today_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        strategy_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        # Calculate option values
        portfolio_options_value = 0.0
        opt_values = {}

        for i, opt_contract in enumerate(option_contracts):
            # Determine when this option should start showing value
            option_start_date = strategy_start_date
            if option_entry_dates[i]:
                try:
                    entry_date = datetime.strptime(option_entry_dates[i], "%Y-%m-%d").date()
                    option_start_date = max(strategy_start_date, entry_date)
                except:
                    pass
            
            # Skip if before option entry date or after expiry
            if today_date < option_start_date or today_date > opt_contract.expiry:
                opt_values[f"opt_{i}"] = 0.0
                continue

            try:
                # Create market snapshot for this date
                market_snapshot = CoreMarketSnapshot(
                    spot=spot,
                    rate=market.get("rate", 0.03),
                    volatility=market.get("volatility", 0.25),
                    dividend_yield=market.get("dividend_yield", 0),
                    timestamp=date_str,
                )
                
                # Price the option using Black-Scholes
                price = black_scholes_price(
                    option=opt_contract,
                    market=market_snapshot,
                    today=today_date,
                )
                value = price * opt_contract.quantity
                opt_values[f"opt_{i}"] = value
                portfolio_options_value += value
            except Exception as e:
                print(f"Error pricing option {i} on {date_str}: {e}")
                opt_values[f"opt_{i}"] = 0.0

        # Calculate stock value
        portfolio_stock_value = 0.0
        stock_values = {}
        for stock_symbol, quantity in stocks.items():
            stock_value = spot * quantity if stock_symbol == symbol else spot * quantity
            stock_values["stock"] = stock_value
            portfolio_stock_value += stock_value

        # Total portfolio
        portfolio_total = portfolio_options_value + portfolio_stock_value

        timeline_data.append(
            {
                "date": date_str,
                "underlying": spot,
                "portfolio_total": portfolio_total,
                "portfolio_options": portfolio_options_value,
                "instruments": {**opt_values, **stock_values},
            }
        )

        for key in opt_values:
            instruments_timeline[key].append(opt_values[key])
        if "stock" in stock_values:
            instruments_timeline["stock"].append(stock_values["stock"])

    # Create markers for entry and expiry dates
    markers = []
    for i, opt_contract in enumerate(option_contracts):
        # Entry marker
        markers.append(
            {
                "date": dates[0] if dates else "2026-01-22",
                "label": f"{opt_contract.option_type.upper()} opened",
            }
        )
        # Expiry marker
        expiry_str = opt_contract.expiry.strftime("%Y-%m-%d")
        markers.append(
            {
                "date": expiry_str,
                "label": f"{opt_contract.option_type.upper()} expired",
            }
        )

    return {
        "dates": dates,
        "underlying": [spot_prices.get(d, market["spot"]) for d in dates],
        "portfolio_total": [t["portfolio_total"] for t in timeline_data],
        "portfolio_options": [t["portfolio_options"] for t in timeline_data],
        "buy_and_hold": [
            initial_cost * (spot_prices.get(d, market["spot"]) / initial_spot) 
            for d in dates
        ] if initial_spot > 0 else [],
        "initial_cost": initial_cost,
        "initial_spot": initial_spot,
        "instruments": {
            k: v for k, v in instruments_timeline.items() if len(v) > 0
        },
        "markers": markers,
    }
