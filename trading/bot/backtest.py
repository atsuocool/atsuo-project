import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime
from .strategies import STRATEGIES, Signal

def run_backtest(symbol: str, strategy_name: str, start_date: str, end_date: str, initial_capital: float = 10000.0):
    # Convert crypto symbols for yfinance
    yf_symbol = symbol.replace("/", "-")
    df = yf.download(yf_symbol, start=start_date, end=end_date, progress=False)
    if df.empty:
        raise ValueError(f"No data for {symbol}")
    df.columns = [c.lower() for c in df.columns]
    df = df.rename(columns={"adj close": "adj_close"})
    df = df.reset_index()
    
    strategy = STRATEGIES[strategy_name]()
    capital = initial_capital
    position = 0.0
    entry_price = 0.0
    trades = []

    for i in range(50, len(df)):
        window = df.iloc[:i+1]
        sig = strategy.generate_signal(window)
        price = float(df["close"].iloc[i])
        date = str(df["date"].iloc[i].date()) if hasattr(df["date"].iloc[i], "date") else str(df.index[i])

        if sig.signal == Signal.BUY and position == 0:
            position = capital / price
            entry_price = price
            capital = 0
            trades.append({"date": date, "side": "BUY", "price": price, "reason": sig.reason, "pnl": 0})
        elif sig.signal == Signal.SELL and position > 0:
            pnl = (price - entry_price) * position
            capital = position * price
            trades.append({"date": date, "side": "SELL", "price": price, "reason": sig.reason, "pnl": round(pnl, 2)})
            position = 0

    # Close open position at end
    if position > 0:
        final_price = float(df["close"].iloc[-1])
        pnl = (final_price - entry_price) * position
        capital = position * final_price
        trades.append({"date": str(df["date"].iloc[-1].date() if hasattr(df["date"].iloc[-1], "date") else df.index[-1]), "side": "SELL", "price": final_price, "reason": "End of backtest", "pnl": round(pnl, 2)})

    total_return = ((capital - initial_capital) / initial_capital) * 100
    win_trades = [t for t in trades if t["side"] == "SELL" and t["pnl"] > 0]
    sell_trades = [t for t in trades if t["side"] == "SELL"]
    win_rate = (len(win_trades) / len(sell_trades) * 100) if sell_trades else 0

    # Sharpe ratio approximation
    if len(df) > 1:
        returns = df["close"].pct_change().dropna()
        sharpe = float(returns.mean() / returns.std() * np.sqrt(252)) if returns.std() > 0 else 0
    else:
        sharpe = 0

    # Max drawdown
    equity = [initial_capital]
    cap = initial_capital
    pos = 0.0
    ep = 0.0
    for i in range(50, len(df)):
        window = df.iloc[:i+1]
        sig = strategy.generate_signal(window)
        price = float(df["close"].iloc[i])
        if sig.signal == Signal.BUY and pos == 0:
            pos = cap / price; ep = price; cap = 0
        elif sig.signal == Signal.SELL and pos > 0:
            cap = pos * price; pos = 0
        equity.append(cap + pos * price if pos > 0 else cap)
    equity_series = pd.Series(equity)
    peak = equity_series.cummax()
    drawdown = ((equity_series - peak) / peak).min() * 100

    return {
        "symbol": symbol,
        "strategy": strategy_name,
        "start_date": start_date,
        "end_date": end_date,
        "initial_capital": initial_capital,
        "final_capital": round(capital, 2),
        "total_return": round(total_return, 2),
        "sharpe_ratio": round(sharpe, 3),
        "max_drawdown": round(float(drawdown), 2),
        "win_rate": round(win_rate, 2),
        "total_trades": len(sell_trades),
        "trades": trades,
    }
