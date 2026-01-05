import pandas as pd


def serialize_series(series: pd.Series) -> dict:
    """
    Convert a pandas Series to a JSON-serializable dictionary.
    
    Returns dict with 'dates' and 'values' keys.
    """
    return {
        "dates": series.index.strftime("%Y-%m-%d").tolist(),
        "values": series.values.tolist(),
    }
