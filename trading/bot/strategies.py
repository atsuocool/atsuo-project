from dataclasses import dataclass
from enum import Enum
import pandas as pd
import numpy as np

class Signal(Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"

@dataclass
class TradeSignal:
    signal: Signal
    price: float
    reason: str

class MACrossStrategy:
    name = "MA Cross"
    short_period = 20
    long_period = 50

    def generate_signal(self, df: pd.DataFrame) -> TradeSignal:
        df = df.copy()
        df["sma_short"] = df["close"].rolling(self.short_period).mean()
        df["sma_long"] = df["close"].rolling(self.long_period).mean()
        if len(df) < self.long_period + 1:
            return TradeSignal(Signal.HOLD, df["close"].iloc[-1], "Not enough data")
        prev_short = df["sma_short"].iloc[-2]
        prev_long = df["sma_long"].iloc[-2]
        curr_short = df["sma_short"].iloc[-1]
        curr_long = df["sma_long"].iloc[-1]
        price = df["close"].iloc[-1]
        if prev_short <= prev_long and curr_short > curr_long:
            return TradeSignal(Signal.BUY, price, "Golden Cross")
        elif prev_short >= prev_long and curr_short < curr_long:
            return TradeSignal(Signal.SELL, price, "Death Cross")
        return TradeSignal(Signal.HOLD, price, "No cross")

class RSIBBStrategy:
    name = "RSI + Bollinger Bands"
    rsi_period = 14
    bb_period = 20
    bb_std = 2
    oversold = 30
    overbought = 70

    def generate_signal(self, df: pd.DataFrame) -> TradeSignal:
        df = df.copy()
        delta = df["close"].diff()
        gain = delta.where(delta > 0, 0).rolling(self.rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(self.rsi_period).mean()
        rs = gain / loss
        df["rsi"] = 100 - (100 / (1 + rs))
        df["bb_mid"] = df["close"].rolling(self.bb_period).mean()
        df["bb_std"] = df["close"].rolling(self.bb_period).std()
        df["bb_upper"] = df["bb_mid"] + self.bb_std * df["bb_std"]
        df["bb_lower"] = df["bb_mid"] - self.bb_std * df["bb_std"]
        rsi = df["rsi"].iloc[-1]
        price = df["close"].iloc[-1]
        lower = df["bb_lower"].iloc[-1]
        upper = df["bb_upper"].iloc[-1]
        if rsi < self.oversold and price <= lower:
            return TradeSignal(Signal.BUY, price, f"RSI={rsi:.1f}, price at lower BB")
        elif rsi > self.overbought and price >= upper:
            return TradeSignal(Signal.SELL, price, f"RSI={rsi:.1f}, price at upper BB")
        return TradeSignal(Signal.HOLD, price, f"RSI={rsi:.1f}")

class MACDStrategy:
    name = "MACD"

    def generate_signal(self, df: pd.DataFrame) -> TradeSignal:
        df = df.copy()
        ema12 = df["close"].ewm(span=12).mean()
        ema26 = df["close"].ewm(span=26).mean()
        df["macd"] = ema12 - ema26
        df["signal"] = df["macd"].ewm(span=9).mean()
        if len(df) < 27:
            return TradeSignal(Signal.HOLD, df["close"].iloc[-1], "Not enough data")
        prev_macd = df["macd"].iloc[-2]
        prev_sig = df["signal"].iloc[-2]
        curr_macd = df["macd"].iloc[-1]
        curr_sig = df["signal"].iloc[-1]
        price = df["close"].iloc[-1]
        if prev_macd <= prev_sig and curr_macd > curr_sig:
            return TradeSignal(Signal.BUY, price, "MACD bullish crossover")
        elif prev_macd >= prev_sig and curr_macd < curr_sig:
            return TradeSignal(Signal.SELL, price, "MACD bearish crossover")
        return TradeSignal(Signal.HOLD, price, "No crossover")

STRATEGIES = {
    "ma_cross": MACrossStrategy,
    "rsi_bb": RSIBBStrategy,
    "macd": MACDStrategy,
}
