from datetime import date

from app.services.options.core.instruments import OptionContract
from app.services.options.core.market_data import MarketSnapshot
from app.services.options.portfolio.portfolio import (
    Position,
    portfolio_price,
    portfolio_greeks,
    delta_hedge_shares,
)
from app.services.options.pricing.black_scholes import price as bs_price
from app.services.options.pricing.greeks import greeks as bs_greeks


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


def test_portfolio_price_linearity():
    option = make_call()
    market = make_market()

    p1 = [Position(option, quantity=1.0)]
    p2 = [Position(option, quantity=2.0)]

    price1 = portfolio_price(p1, market, TODAY)
    price2 = portfolio_price(p2, market, TODAY)

    assert abs(price2 - 2.0 * price1) < 1e-10


def test_portfolio_greeks_linearity():
    option = make_call()
    market = make_market()

    g1 = portfolio_greeks([Position(option, 1.0)], market, TODAY)
    g2 = portfolio_greeks([Position(option, 3.0)], market, TODAY)

    for k in g1:
        assert abs(g2[k] - 3.0 * g1[k]) < 1e-10


def test_portfolio_matches_sum_of_components():
    call = make_call()
    put = make_put()
    market = make_market()

    positions = [Position(call, 1.0), Position(put, 1.0)]

    # portfolio
    p_port = portfolio_price(positions, market, TODAY)
    g_port = portfolio_greeks(positions, market, TODAY)

    # component sum
    p_sum = bs_price(call, market, TODAY) + bs_price(put, market, TODAY)

    g_call = bs_greeks(call, market, TODAY)
    g_put = bs_greeks(put, market, TODAY)
    g_sum = {
        "delta": g_call["delta"] + g_put["delta"],
        "gamma": g_call["gamma"] + g_put["gamma"],
        "vega": g_call["vega"] + g_put["vega"],
        "theta": g_call["theta"] + g_put["theta"],
        "rho": g_call["rho"] + g_put["rho"],
    }

    assert abs(p_port - p_sum) < 1e-10
    for k in g_port:
        assert abs(g_port[k] - g_sum[k]) < 1e-10


def test_delta_hedge_shares_negates_portfolio_delta():
    call = make_call()
    market = make_market()

    positions = [Position(call, 2.0)]
    g = portfolio_greeks(positions, market, TODAY)

    shares = delta_hedge_shares(positions, market, TODAY)

    # total delta after hedge should be ~0 (underlying delta = 1 per share)
    total_delta = g["delta"] + shares

    assert abs(total_delta) < 1e-10


def test_short_position_flips_signs():
    call = make_call()
    market = make_market()

    long_g = portfolio_greeks([Position(call, 1.0)], market, TODAY)
    short_g = portfolio_greeks([Position(call, -1.0)], market, TODAY)

    for k in long_g:
        assert abs(short_g[k] + long_g[k]) < 1e-10
