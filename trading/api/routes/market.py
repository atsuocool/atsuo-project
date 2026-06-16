from fastapi import APIRouter, HTTPException
import yfinance as yf
import pandas as pd

router = APIRouter()

@router.get("/price/{symbol:path}")
def get_price(symbol: str):
    try:
        yf_symbol = symbol.replace("/", "-")
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period="1d", interval="1m")
        if hist.empty:
            raise HTTPException(status_code=404, detail="Symbol not found")
        price = float(hist["Close"].iloc[-1])
        return {"symbol": symbol, "price": price}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ohlcv/{symbol:path}")
def get_ohlcv(symbol: str, interval: str = "1h", period: str = "30d"):
    try:
        yf_symbol = symbol.replace("/", "-")
        df = yf.download(yf_symbol, period=period, interval=interval, progress=False)
        if df.empty:
            raise HTTPException(status_code=404, detail="No data")
        df = df.reset_index()
        df.columns = [c.lower() for c in df.columns]
        records = []
        for _, row in df.iterrows():
            records.append({
                "time": str(row.get("datetime", row.get("date", ""))),
                "open": round(float(row["open"]), 2),
                "high": round(float(row["high"]), 2),
                "low": round(float(row["low"]), 2),
                "close": round(float(row["close"]), 2),
                "volume": round(float(row["volume"]), 2),
            })
        return {"symbol": symbol, "interval": interval, "data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
