from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class Trade:
    id: int
    symbol: str
    side: str
    price: float
    quantity: float
    timestamp: datetime
    strategy: str
    pnl: float = 0.0

@dataclass  
class BotStatus:
    running: bool = False
    strategy: str = "ma_cross"
    symbol: str = "BTC/USDT"
    entry_price: float = 0.0
    position: float = 0.0
    trades: list = field(default_factory=list)
