import asyncio
import threading
import time
from datetime import datetime
from .strategies import STRATEGIES, Signal

class TradingBot:
    def __init__(self):
        self.running = False
        self.strategy_name = "ma_cross"
        self.symbol = "BTC/USDT"
        self.capital = 1000.0
        self.position = 0.0
        self.entry_price = 0.0
        self.trades = []
        self._thread = None
        self.current_price = 0.0
        self.pnl = 0.0
        self.signals = []

    def start(self, strategy_name: str, symbol: str, capital: float):
        if self.running:
            return {"status": "already running"}
        self.strategy_name = strategy_name
        self.symbol = symbol
        self.capital = capital
        self.running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        return {"status": "started", "strategy": strategy_name, "symbol": symbol}

    def stop(self):
        self.running = False
        return {"status": "stopped"}

    def _run_loop(self):
        import yfinance as yf
        import pandas as pd
        strategy = STRATEGIES[self.strategy_name]()
        while self.running:
            try:
                yf_symbol = self.symbol.replace("/", "-")
                df = yf.download(yf_symbol, period="60d", interval="1h", progress=False)
                if df.empty:
                    time.sleep(60)
                    continue
                df.columns = [c.lower() for c in df.columns]
                df = df.reset_index()
                self.current_price = float(df["close"].iloc[-1])
                sig = strategy.generate_signal(df)
                
                if sig.signal == Signal.BUY and self.position == 0:
                    self.position = self.capital / self.current_price
                    self.entry_price = self.current_price
                    self.capital = 0
                    self.trades.append({"time": datetime.now().isoformat(), "side": "BUY", "price": self.current_price, "reason": sig.reason})
                    self.signals.append({"time": datetime.now().isoformat(), "signal": "BUY", "price": self.current_price})
                elif sig.signal == Signal.SELL and self.position > 0:
                    pnl = (self.current_price - self.entry_price) * self.position
                    self.capital = self.position * self.current_price
                    self.pnl += pnl
                    self.trades.append({"time": datetime.now().isoformat(), "side": "SELL", "price": self.current_price, "reason": sig.reason, "pnl": round(pnl, 2)})
                    self.signals.append({"time": datetime.now().isoformat(), "signal": "SELL", "price": self.current_price})
                    self.position = 0
            except Exception as e:
                print(f"Bot error: {e}")
            time.sleep(300)  # 5 min interval

    def get_status(self):
        portfolio_value = self.capital + self.position * self.current_price
        return {
            "running": self.running,
            "strategy": self.strategy_name,
            "symbol": self.symbol,
            "current_price": self.current_price,
            "position": self.position,
            "entry_price": self.entry_price,
            "capital": self.capital,
            "portfolio_value": round(portfolio_value, 2),
            "pnl": round(self.pnl, 2),
        }

bot_instance = TradingBot()
