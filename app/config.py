import os
import logging
from dotenv import load_dotenv

load_dotenv()

BASE_API_URL = "https://api"
BINANCE_API_URL = f"{BASE_API_URL}.binance.com/api/v3/ticker/price"
KUCOIN_API_URL = f"{BASE_API_URL}.kucoin.com/api/v1/market/orderbook/level1"

BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
KUCOIN_API_KEY = os.getenv("KUCOIN_API_KEY")

if not BINANCE_API_KEY or not KUCOIN_API_KEY:
    logging.warning("Не знайдені API-ключі для Binance або KuCoin. Деякі функції можуть не працювати.")

SUPPORTED_CURRENCIES = ["BTC", "ETH", "USDT"]

SUPPORTED_EXCHANGES = ["Binance", "KuCoin"]
