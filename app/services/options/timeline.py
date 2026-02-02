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
    
    print(f"DEBUG: RAW POSITIONS RECEIVED = {positions}")

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
    all_important_dates = set(dates)  # Track all dates including entry/expiry

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
            entry_date = pos.get("entry_date")
            option_entry_dates.append(entry_date)
            # Add entry and expiry dates to the set for later inclusion
            if entry_date:
                all_important_dates.add(entry_date)
            all_important_dates.add(expiry_date.strftime("%Y-%m-%d"))
            print(f"DEBUG: Option {len(option_contracts)-1}: entry_date = {entry_date}, expiry = {expiry_date}")
        else:
            # It's a stock position
            stocks[pos.get("symbol", symbol)] = pos.get("quantity", 1)
    
    # Sort dates and ensure entry/expiry dates are included
    dates = sorted(list(all_important_dates))
    
    # Fill in missing spot prices for entry/expiry dates using closest available price
    all_dates_sorted = sorted(spot_prices.keys())
    for date_str in dates:
        if date_str not in spot_prices:
            # Find the closest date in available price data
            closest_date = min(all_dates_sorted, key=lambda x: abs(datetime.strptime(x, "%Y-%m-%d") - datetime.strptime(date_str, "%Y-%m-%d")))
            spot_prices[date_str] = spot_prices[closest_date]

    # Compute timeline
    timeline_data = []
    instruments_timeline = {f"opt_{i}": [] for i in range(len(option_contracts))}
    if stocks:
        instruments_timeline["stock"] = []

    # Calculate entry costs for each position at their actual entry dates
    position_costs = {}
    for i, pos in enumerate(positions):
        if pos.get("type") in ["call", "put"]:
            if pos.get("entry_price") is not None:
                # User provided the actual premium
                position_costs[i] = pos.get("entry_price", 0.0) * pos.get("quantity", 1)
            else:
                # We'll calculate at entry date during the timeline loop
                position_costs[i] = None  # To be calculated later
        else:
            # Stock position - cost is known from quantity and entry spot
            position_costs[i] = None

    # First pass: calculate costs at entry dates
    for i, pos in enumerate(positions):
        if position_costs[i] is not None:
            continue  # Already have the cost
        
        entry_date_str = option_entry_dates[i] if option_entry_dates[i] else dates[0] if dates else "2026-01-22"
        entry_spot = spot_prices.get(entry_date_str, market["spot"])
        
        if pos.get("type") in ["call", "put"]:
            # Calculate option cost using Black-Scholes at entry date
            expiry_date = datetime.strptime(pos.get("expiry"), "%Y-%m-%d").date()
            opt_contract = OptionContract(
                symbol=pos.get("symbol", symbol),
                option_type=pos["type"],
                style="european",
                strike=pos.get("strike"),
                expiry=expiry_date,
                quantity=1,
            )
            entry_date_obj = datetime.strptime(entry_date_str, "%Y-%m-%d").date()
            market_snapshot = CoreMarketSnapshot(
                spot=entry_spot,
                rate=market.get("rate", 0.03),
                volatility=market.get("volatility", 0.25),
                dividend_yield=market.get("dividend_yield", 0),
                timestamp=entry_date_str,
            )
            try:
                price = black_scholes_price(
                    option=opt_contract,
                    market=market_snapshot,
                    today=entry_date_obj,
                )
                position_costs[i] = price * pos.get("quantity", 1)
            except:
                position_costs[i] = 0.0
        else:
            # Stock position
            position_costs[i] = entry_spot * pos.get("quantity", 1)

    # Calculate total capital deployed and entry dates for buy-and-hold comparison
    total_capital = sum(position_costs.values())
    first_entry_date = None
    first_entry_spot = market["spot"]
    
    for i, pos in enumerate(positions):
        entry_date_str = option_entry_dates[i] if option_entry_dates[i] else dates[0] if dates else "2026-01-22"
        if first_entry_date is None:
            first_entry_date = entry_date_str
            first_entry_spot = spot_prices.get(entry_date_str, market["spot"])
        else:
            try:
                if datetime.strptime(entry_date_str, "%Y-%m-%d") < datetime.strptime(first_entry_date, "%Y-%m-%d"):
                    first_entry_date = entry_date_str
                    first_entry_spot = spot_prices.get(entry_date_str, market["spot"])
            except:
                pass



    # Main timeline loop
    buy_and_hold_values = []

    for date_str in dates:
        spot = spot_prices.get(date_str, market["spot"])
        today_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        strategy_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()

        # Calculate buy-and-hold: if we invested total_capital in stock at first entry
        if first_entry_spot > 0 and total_capital > 0:
            shares_bought = total_capital / first_entry_spot
            bh_value = shares_bought * spot
        else:
            bh_value = 0.0
        buy_and_hold_values.append(bh_value)

        # Calculate cumulative cost (positions entered by this date)
        cumulative_cost = 0.0
        
        # Calculate option values
        portfolio_options_value = 0.0
        opt_values = {}
        any_option_active = False

        for i, opt_contract in enumerate(option_contracts):
            # Get the actual entry date for this position
            # This is the date when position_costs were calculated
            entry_date_str = option_entry_dates[i] if option_entry_dates[i] else None
            
            # If no entry date provided, use timeline start date as entry
            if not entry_date_str:
                entry_date_str = dates[0] if dates else "2026-01-22"
            
            try:
                entry_date_obj = datetime.strptime(entry_date_str, "%Y-%m-%d").date()
                option_start_date = max(strategy_start_date, entry_date_obj)
            except:
                option_start_date = strategy_start_date
            
            # Add cost if this option has been entered by today
            if today_date >= option_start_date:
                cumulative_cost += position_costs[i] if position_costs[i] is not None else 0.0
            
            # Before entry date: option has no value
            if today_date < option_start_date:
                opt_values[f"opt_{i}"] = 0.0
                continue
            
            # After expiry: option expires worthless (or exercise value if ITM)
            if today_date > opt_contract.expiry:
                # Calculate intrinsic value at expiry
                if opt_contract.option_type == "call":
                    intrinsic = max(0, spot - opt_contract.strike)
                else:  # put
                    intrinsic = max(0, opt_contract.strike - spot)
                opt_values[f"opt_{i}"] = intrinsic * opt_contract.quantity
                portfolio_options_value += intrinsic * opt_contract.quantity
                any_option_active = True
                continue

            # During option period: calculate current value with Black-Scholes
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
                any_option_active = True
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

        # Calculate portfolio VALUE (not P&L):
        # Before entry: show the capital available (flat line)
        # At entry: show the current market value of positions
        # As time passes: moves with option values and stock prices
        if any_option_active or portfolio_stock_value != 0:
            # Positions are active - show their market value
            portfolio_total = portfolio_options_value + portfolio_stock_value
            portfolio_options_result = portfolio_options_value
        else:
            # No positions active yet - show the capital that will be deployed
            portfolio_total = total_capital
            portfolio_options_result = total_capital

        timeline_data.append(
            {
                "date": date_str,
                "underlying": spot,
                "portfolio_total": portfolio_total,
                "portfolio_options": portfolio_options_result,
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
        # Entry marker - use actual entry date from position
        entry_date_str = option_entry_dates[i] if option_entry_dates[i] else dates[0] if dates else "2026-01-22"
        markers.append(
            {
                "date": entry_date_str,
                "label": f"{opt_contract.option_type.upper()} #{i+1} entry",
            }
        )
        # Expiry marker
        expiry_str = opt_contract.expiry.strftime("%Y-%m-%d")
        markers.append(
            {
                "date": expiry_str,
                "label": f"{opt_contract.option_type.upper()} #{i+1} expiry",
            }
        )

    return {
        "dates": dates,
        "underlying": [spot_prices.get(d, market["spot"]) for d in dates],
        "portfolio_total": [t["portfolio_total"] for t in timeline_data],
        "portfolio_options": [t["portfolio_options"] for t in timeline_data],
        "buy_and_hold": buy_and_hold_values,
        "instruments": {
            k: v for k, v in instruments_timeline.items() if len(v) > 0
        },
        "markers": markers,
    }
