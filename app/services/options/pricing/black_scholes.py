import math
from datetime import date
from scipy.stats import norm

from app.services.options.core.instruments import OptionContract
from app.services.options.core.market_data import MarketSnapshot


def price(
    option: OptionContract,
    market: MarketSnapshot,
    today: date
) -> float:
    """
    European Black-Scholes price
    """
    S = market.spot
    K = option.strike
    r = market.rate
    q = market.dividend_yield
    sigma = market.volatility

    T = (option.expiry - today).days / 365.0

    # Intrinsic value at expiry
    if T <= 0:
        if option.option_type == "call":
            return max(S - K, 0.0)
        else:
            return max(K - S, 0.0)

    # Guard against zero volatility
    if sigma <= 0:
        forward = S * math.exp(-q * T) - K * math.exp(-r * T)
        if option.option_type == "call":
            return max(forward, 0.0)
        else:
            return max(-forward, 0.0)

    sqrt_T = math.sqrt(T)

    d1 = (
        math.log(S / K)
        + (r - q + 0.5 * sigma ** 2) * T
    ) / (sigma * sqrt_T)

    d2 = d1 - sigma * sqrt_T

    if option.option_type == "call":
        return (
            S * math.exp(-q * T) * norm.cdf(d1)
            - K * math.exp(-r * T) * norm.cdf(d2)
        )
    else:
        return (
            K * math.exp(-r * T) * norm.cdf(-d2)
            - S * math.exp(-q * T) * norm.cdf(-d1)
        )
