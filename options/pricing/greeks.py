import math
from datetime import date
from scipy.stats import norm

from core.instruments import OptionContract
from core.market_data import MarketSnapshot


def greeks(option: OptionContract, market: MarketSnapshot, today: date) -> dict:
    """
    Analytical Black–Scholes Greeks for European options.

    Conventions:
    - theta returned per DAY (not per year)
    - vega returned per 1.00 vol (i.e., sigma change of 1.0). Many UIs prefer per 1% vol:
      use vega_per_1pct = vega / 100.
    - rho returned per 1.00 rate (i.e., r change of 1.0). Per 1% rate: rho / 100.
    """
    S = market.spot
    K = option.strike
    r = market.rate
    q = market.dividend_yield
    sigma = market.volatility

    T = (option.expiry - today).days / 365.0

    # At expiry: price is intrinsic and most Greeks collapse.
    # Delta becomes a step function at-the-money; we return a reasonable convention.
    if T <= 0:
        if option.option_type == "call":
            intrinsic = max(S - K, 0.0)
            delta = 1.0 if S > K else (0.0 if S < K else 0.5)
        else:
            intrinsic = max(K - S, 0.0)
            delta = -1.0 if S < K else (0.0 if S > K else -0.5)

        return {
            "price_intrinsic": intrinsic,
            "delta": float(delta),
            "gamma": 0.0,
            "vega": 0.0,
            "theta": 0.0,
            "rho": 0.0,
        }

    # Zero vol: distribution collapses; most Greeks ~0 except delta becomes step-like.
    if sigma <= 0:
        # forward PV difference
        forward = S * math.exp(-q * T) - K * math.exp(-r * T)

        if option.option_type == "call":
            delta = math.exp(-q * T) if forward > 0 else (0.0 if forward < 0 else 0.5 * math.exp(-q * T))
            rho = T * K * math.exp(-r * T) if forward > 0 else 0.0
        else:
            delta = -math.exp(-q * T) if forward < 0 else (0.0 if forward > 0 else -0.5 * math.exp(-q * T))
            rho = -T * K * math.exp(-r * T) if forward < 0 else 0.0

        return {
            "delta": float(delta),
            "gamma": 0.0,
            "vega": 0.0,
            "theta": 0.0,
            "rho": float(rho),
        }

    sqrt_T = math.sqrt(T)
    disc_q = math.exp(-q * T)
    disc_r = math.exp(-r * T)

    d1 = (math.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * sqrt_T)
    d2 = d1 - sigma * sqrt_T

    pdf_d1 = norm.pdf(d1)

    # Common terms
    gamma = disc_q * pdf_d1 / (S * sigma * sqrt_T)
    vega = S * disc_q * pdf_d1 * sqrt_T  # per 1.00 vol

    if option.option_type == "call":
        delta = disc_q * norm.cdf(d1)
        rho = K * T * disc_r * norm.cdf(d2)  # per 1.00 rate

        theta_year = (
            - (S * disc_q * pdf_d1 * sigma) / (2.0 * sqrt_T)
            - r * K * disc_r * norm.cdf(d2)
            + q * S * disc_q * norm.cdf(d1)
        )
    else:
        delta = disc_q * (norm.cdf(d1) - 1.0)
        rho = -K * T * disc_r * norm.cdf(-d2)  # per 1.00 rate

        theta_year = (
            - (S * disc_q * pdf_d1 * sigma) / (2.0 * sqrt_T)
            + r * K * disc_r * norm.cdf(-d2)
            - q * S * disc_q * norm.cdf(-d1)
        )

    theta_day = theta_year / 365.0

    return {
        "delta": float(delta),
        "gamma": float(gamma),
        "vega": float(vega),
        "theta": float(theta_day),
        "rho": float(rho),
        # helpful extras for debugging/front-end if you want them:
        "d1": float(d1),
        "d2": float(d2),
    }
