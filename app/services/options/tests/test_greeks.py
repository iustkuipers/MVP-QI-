from datetime import date

from app.services.options.core.instruments import OptionContract
from app.services.options.core.market_data import MarketSnapshot
from app.services.options.pricing.black_scholes import price
from app.services.options.pricing.greeks import greeks


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


# ---------- BASIC SIGN TESTS ----------

def test_call_delta_positive():
    g = greeks(make_call(), make_market(), TODAY)
    assert g["delta"] > 0.0


def test_put_delta_negative():
    g = greeks(make_put(), make_market(), TODAY)
    assert g["delta"] < 0.0


def test_gamma_positive_for_call_and_put():
    call_g = greeks(make_call(), make_market(), TODAY)
    put_g = greeks(make_put(), make_market(), TODAY)

    assert call_g["gamma"] > 0.0
    assert put_g["gamma"] > 0.0


def test_vega_positive_for_call_and_put():
    call_g = greeks(make_call(), make_market(), TODAY)
    put_g = greeks(make_put(), make_market(), TODAY)

    assert call_g["vega"] > 0.0
    assert put_g["vega"] > 0.0


def test_theta_negative_for_atm_call():
    g = greeks(make_call(), make_market(), TODAY)
    assert g["theta"] < 0.0


# ---------- MONOTONIC BEHAVIOR ----------

def test_call_delta_increases_with_spot():
    option = make_call()

    low_spot = greeks(option, make_market(spot=160), TODAY)["delta"]
    high_spot = greeks(option, make_market(spot=210), TODAY)["delta"]

    assert high_spot > low_spot


# ---------- EXPIRY BEHAVIOR ----------

def test_gamma_zero_at_expiry():
    option = make_call()
    market = make_market()

    g = greeks(option, market, option.expiry)

    assert g["gamma"] == 0.0
    assert g["vega"] == 0.0
    assert g["theta"] == 0.0


def test_delta_at_expiry_itm_call_is_one():
    option = make_call(strike=180)
    market = make_market(spot=200)

    g = greeks(option, market, option.expiry)

    assert g["delta"] == 1.0


def test_delta_at_expiry_otm_call_is_zero():
    option = make_call(strike=180)
    market = make_market(spot=160)

    g = greeks(option, market, option.expiry)

    assert g["delta"] == 0.0


# ---------- NUMERICAL CONSISTENCY ----------

def test_delta_matches_price_derivative():
    """
    Delta ≈ dPrice / dSpot
    """
    option = make_call()
    market = make_market()
    eps = 0.01

    base_price = price(option, market, TODAY)

    bumped_up = make_market(spot=market.spot + eps)
    bumped_down = make_market(spot=market.spot - eps)

    price_up = price(option, bumped_up, TODAY)
    price_down = price(option, bumped_down, TODAY)

    numerical_delta = (price_up - price_down) / (2 * eps)
    analytic_delta = greeks(option, market, TODAY)["delta"]

    assert abs(numerical_delta - analytic_delta) < 1e-3
