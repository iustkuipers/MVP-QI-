from datetime import date

def year_fraction(today: date, expiry: date) -> float:
    return max((expiry - today).days / 365.0, 0.0)
