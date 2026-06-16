from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...bot.backtest import run_backtest

router = APIRouter()

class BacktestRequest(BaseModel):
    symbol: str = "BTC-USD"
    strategy: str = "ma_cross"
    start_date: str = "2023-01-01"
    end_date: str = "2024-01-01"
    initial_capital: float = 10000.0

@router.post("/run")
def run_backtest_endpoint(req: BacktestRequest):
    try:
        result = run_backtest(req.symbol, req.strategy, req.start_date, req.end_date, req.initial_capital)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
