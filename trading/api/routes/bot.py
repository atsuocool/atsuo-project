from fastapi import APIRouter
from pydantic import BaseModel
from ...bot.engine import bot_instance

router = APIRouter()

class BotStartRequest(BaseModel):
    strategy: str = "ma_cross"
    symbol: str = "BTC-USD"
    capital: float = 1000.0

@router.post("/start")
def start_bot(req: BotStartRequest):
    return bot_instance.start(req.strategy, req.symbol, req.capital)

@router.post("/stop")
def stop_bot():
    return bot_instance.stop()

@router.get("/status")
def get_status():
    return bot_instance.get_status()

@router.get("/trades")
def get_trades():
    return {"trades": bot_instance.trades}
