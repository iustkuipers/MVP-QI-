import numpy as np
import pandas as pd


TRADING_DAYS = 252


# ---------- Core helpers ----------
def periods_per_year(nav: pd.Series) -> float:
    index = nav.index
    days = (index[-1] - index[0]).days
    if days <= 0:
        return 252.0
    return len(index) / (days / 365.25)



def total_return(nav: pd.Series) -> float:
    return nav.iloc[-1] / nav.iloc[0] - 1.0


def cagr(nav: pd.Series) -> float:
    n_years = (nav.index[-1] - nav.index[0]).days / 365.25
    return (nav.iloc[-1] / nav.iloc[0]) ** (1 / n_years) - 1.0



def annualized_volatility(returns: pd.Series) -> float:
    ppy = periods_per_year(returns)
    return returns.std() * np.sqrt(ppy)


def sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0) -> float:
    ppy = periods_per_year(returns)
    excess_returns = returns - risk_free_rate / ppy
    if excess_returns.std() == 0:
        return np.nan
    return excess_returns.mean() / excess_returns.std() * np.sqrt(ppy)



def max_drawdown(nav: pd.Series) -> float:
    running_max = nav.cummax()
    drawdown = nav / running_max - 1.0
    return drawdown.min()


# ---------- Relative metrics ----------

def excess_return(
    portfolio_nav: pd.Series,
    benchmark_nav: pd.Series,
) -> float:
    return total_return(portfolio_nav) - total_return(benchmark_nav)


def tracking_error(portfolio_returns, benchmark_returns):
    ppy = periods_per_year(portfolio_returns)
    diff = portfolio_returns - benchmark_returns
    return diff.std() * np.sqrt(ppy)


def information_ratio(
    portfolio_returns: pd.Series,
    benchmark_returns: pd.Series,
) -> float:
    te = tracking_error(portfolio_returns, benchmark_returns)
    if te == 0:
        return np.nan

    diff = portfolio_returns - benchmark_returns
    ppy = periods_per_year(portfolio_returns)
    return diff.mean() / diff.std() * np.sqrt(ppy)



# ---------- Main entry point ----------

def compute_metrics(
    nav: pd.Series,
    returns: pd.Series,
    risk_free_rate: float = 0.0,
    benchmark_nav: pd.Series | None = None,
    benchmark_returns: pd.Series | None = None,
) -> dict:
    """
    Compute portfolio (and optional benchmark) metrics.
    """

    metrics = {
        "total_return": total_return(nav),
        "cagr": cagr(nav),
        "volatility": annualized_volatility(returns),
        "sharpe": sharpe_ratio(returns, risk_free_rate),
        "max_drawdown": max_drawdown(nav),
    }

    if benchmark_nav is not None and benchmark_returns is not None:
        metrics.update(
            {
                "excess_return": excess_return(nav, benchmark_nav),
                "tracking_error": tracking_error(
                    returns, benchmark_returns
                ),
                "information_ratio": information_ratio(
                    returns, benchmark_returns
                ),
            }
        )

    return metrics
