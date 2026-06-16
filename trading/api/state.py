from trading.bot.engine import TradingBot

_bot = TradingBot()


def get_bot() -> TradingBot:
    return _bot
