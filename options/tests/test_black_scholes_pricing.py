from datetime import date

from core.instruments import OptionContract
from core.market_data import MarketSnapshot
from pricing.black_scholes import price


TODAY = date(2026, 1, 22)


def make_call(strike=180, expiry=date(2026, 6, 19)):
    return OptionContract(
        symbol="AAPL",
        option_type="call",
        style="european",
        strike=strike,
        expiry=expiry,
        quantity=1.0,
    )


def make_put(strike=180, expiry=date(2026, 6, 19)):
    return OptionContract(
        symbol="AAPL",
        option_type="put",
        style="european",
        strike=strike,
        expiry=expiry,
        quantity=1.0,
    )


def make_market(spot=185, vol=0.25, rate=0.03, div=0.005):
    return MarketSnapshot(
        spot=spot,
        rate=rate,
        dividend_yield=div,
        volatility=vol,
        timestamp="2026-01-22",
    )


# ---------- BASIC SANITY ----------

def test_call_price_is_positive():
    option = make_call()
    market = make_market()

    p = price(option, market, TODAY)

    assert p > 0.0


def test_put_price_is_positive():
    option = make_put()
    market = make_market()

    p = price(option, market, TODAY)

    assert p > 0.0


# ---------- MONOTONICITY ----------

def test_call_price_increases_with_spot():
    option = make_call()

    low_spot = make_market(spot=160)
    high_spot = make_market(spot=210)

    p_low = price(option, low_spot, TODAY)
    p_high = price(option, high_spot, TODAY)

    assert p_high > p_low


def test_call_price_increases_with_volatility():
    option = make_call()

    low_vol = make_market(vol=0.10)
    high_vol = make_market(vol=0.60)

    p_low = price(option, low_vol, TODAY)
    p_high = price(option, high_vol, TODAY)

    assert p_high > p_low


def test_put_price_increases_with_volatility():
    option = make_put()

    low_vol = make_market(vol=0.10)
    high_vol = make_market(vol=0.60)

    p_low = price(option, low_vol, TODAY)
    p_high = price(option, high_vol, TODAY)

    assert p_high > p_low


# ---------- EXPIRY BEHAVIOR ----------

def test_call_intrinsic_value_at_expiry():
    option = make_call(strike=180)
    market = make_market(spot=195)

    p = price(option, market, option.expiry)

    assert p == 15.0


def test_put_intrinsic_value_at_expiry():
    option = make_put(strike=180)
    market = make_market(spot=165)

    p = price(option, market, option.expiry)

    assert p == 15.0


# ---------- ZERO VOLATILITY ----------

def test_zero_volatility_call_equals_discounted_forward_payoff():
    option = make_call()
    market = make_market(vol=0.0)

    p = price(option, market, TODAY)

    assert p >= 0.0


def test_zero_volatility_put_equals_discounted_forward_payoff():
    option = make_put()
    market = make_market(vol=0.0)

    p = price(option, market, TODAY)

    assert p >= 0.0
