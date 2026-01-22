from datetime import date

from app.services.options.core.instruments import OptionContract
from app.services.options.core.market_data import MarketSnapshot
from app.services.options.pricing.black_scholes import price
from app.services.options.volatility.implied_vol import implied_vol


TODAY = date(2026, 1, 22)


def make_call():
    return OptionContract(
        symbol="AAPL",
        option_type="call",
        style="european",
        strike=180,
        expiry=date(2026, 6, 19),
        quantity=1.0,
    )


def make_market(vol):
    return MarketSnapshot(
        spot=185,
        rate=0.03,
        dividend_yield=0.005,
        volatility=vol,
        timestamp="2026-01-22",
    )


# ---------- ROUND TRIP ----------

def test_implied_vol_round_trip():
    option = make_call()
    true_vol = 0.35

    market = make_market(true_vol)
    market_price = price(option, market, TODAY)

    implied = implied_vol(
        market_price,
        option,
        make_market(vol=0.20),  # initial market snapshot
        TODAY,
    )

    assert abs(implied - true_vol) < 1e-4


# ---------- ROBUSTNESS ----------

def test_implied_vol_handles_high_vol():
    option = make_call()
    true_vol = 1.20

    market = make_market(true_vol)
    market_price = price(option, market, TODAY)

    implied = implied_vol(
        market_price,
        option,
        make_market(vol=0.20),
        TODAY,
    )

    assert abs(implied - true_vol) < 1e-3


def test_implied_vol_rejects_zero_price():
    option = make_call()
    market = make_market(0.25)

    try:
        implied_vol(0.0, option, market, TODAY)
        assert False
    except Exception:
        assert True
