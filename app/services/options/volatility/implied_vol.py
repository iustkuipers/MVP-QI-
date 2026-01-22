import math
from datetime import date

from app.services.options.core.instruments import OptionContract
from app.services.options.core.market_data import MarketSnapshot
from app.services.options.pricing.black_scholes import price
from app.services.options.pricing.greeks import greeks


class ImpliedVolError(Exception):
    pass


def implied_vol(
    market_price: float,
    option: OptionContract,
    market: MarketSnapshot,
    today: date,
    *,
    initial_guess: float = 0.2,
    tol: float = 1e-6,
    max_iter: int = 50,
) -> float:
    """
    Solve for implied volatility using Newton-Raphson
    with bisection fallback.
    """
    if market_price <= 0:
        raise ImpliedVolError("Market price must be positive")

    T = (option.expiry - today).days / 365.0
    if T <= 0:
        raise ImpliedVolError("Implied vol undefined at expiry")

    # --- Newton-Raphson ---
    sigma = max(initial_guess, 1e-4)

    for _ in range(max_iter):
        market_with_sigma = MarketSnapshot(
            spot=market.spot,
            rate=market.rate,
            dividend_yield=market.dividend_yield,
            volatility=sigma,
            timestamp=market.timestamp,
        )

        model_price = price(option, market_with_sigma, today)
        diff = model_price - market_price

        if abs(diff) < tol:
            return sigma

        vega = greeks(option, market_with_sigma, today)["vega"]

        if vega < 1e-8:
            break  # fallback

        sigma -= diff / vega

        if sigma <= 0:
            break  # fallback

    # --- Bisection fallback ---
    low, high = 1e-6, 5.0

    for _ in range(100):
        mid = 0.5 * (low + high)

        market_mid = MarketSnapshot(
            spot=market.spot,
            rate=market.rate,
            dividend_yield=market.dividend_yield,
            volatility=mid,
            timestamp=market.timestamp,
        )

        mid_price = price(option, market_mid, today)

        if abs(mid_price - market_price) < tol:
            return mid

        if mid_price > market_price:
            high = mid
        else:
            low = mid

    raise ImpliedVolError("Implied volatility did not converge")
