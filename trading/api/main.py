from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from .routes import market, bot, backtest
from ..bot.engine import bot_instance

app = FastAPI(title="Trading Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router, prefix="/api/market", tags=["market"])
app.include_router(bot.router, prefix="/api/bot", tags=["bot"])
app.include_router(backtest.router, prefix="/api/backtest", tags=["backtest"])

@app.get("/")
def root():
    return {"status": "ok", "message": "Trading Bot API"}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = {
                "type": "status",
                "data": bot_instance.get_status()
            }
            await ws.send_text(json.dumps(data))
            await asyncio.sleep(5)
    except Exception:
        pass
