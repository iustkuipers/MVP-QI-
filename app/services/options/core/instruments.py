from dataclasses import dataclass
from datetime import date
from typing import Literal

OptionType = Literal["call", "put"]
StyleType = Literal["european", "american"]

@dataclass(frozen=True)
class OptionContract:
    symbol: str
    option_type: OptionType
    style: StyleType
    strike: float
    expiry: date
    quantity: float = 1.0
