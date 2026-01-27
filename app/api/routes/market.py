"""
Market data API routes - Get historical prices for instruments.
"""

from fastapi import APIRouter
from datetime import date, timedelta
import pandas as pd

from app.services.market_data.loader import load_prices

router = APIRouter(prefix="/api/v1/market", tags=["market"])


@router.get("/history/{ticker}")
def get_market_history(ticker: str, days: int = 60):
    """
    Get historical price data for a ticker from market_data loader.
    
    Parameters:
    - ticker: Stock symbol (e.g., 'AAPL')
    - days: Number of historical days to return (default 60)
    
    Returns:
    - list of {date, price}
    """
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days + 30)  # Extra buffer for weekends
        
        # Load prices from market_data loader
        prices_df = load_prices(
            tickers=[ticker.upper()],
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            provider="mock",
        )
        
        # Verify we got data
        if prices_df.empty:
            return {"error": "No data returned", "ticker": ticker}
        
        # Convert DataFrame to list of {date, price}
        result = []
        ticker_col = ticker.upper()
        
        for date_idx, price_val in prices_df[ticker_col].items():
            result.append({
                "date": date_idx.strftime("%Y-%m-%d"),
                "price": float(price_val),
            })
        
        # Return last `days` entries
        return result[-days:] if len(result) > days else result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "ticker": ticker,
            "message": "Could not load historical data"
        }
