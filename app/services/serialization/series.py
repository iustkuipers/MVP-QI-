import pandas as pd
import numpy as np


def serialize_series(series: pd.Series) -> dict:
    """
    Convert a pandas Series to a JSON-serializable dictionary.
    
    Converts NaN/inf values to null for JSON compliance.
    Returns dict with 'dates' and 'values' keys.
    """
    dates = series.index.strftime("%Y-%m-%d").tolist()
    
    # Convert NaN and inf to None (null in JSON)
    values = [
        None if (pd.isna(v) or np.isinf(v)) else v
        for v in series.values
    ]
    
    return {
        "dates": dates,
        "values": values,
    }
