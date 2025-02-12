import logging
from app.services.exchange_client import BaseExchange

class KuCoin(BaseExchange):
    def __init__(self):
        super().__init__(
            name="KuCoin",
            api_url="https://api.kucoin.com/api/v1/market/orderbook/level1",
            symbols_url="https://api.kucoin.com/api/v1/symbols"
        )

    def extract_symbols(self, data) -> set:
        return {s["symbol"] for s in data.get("data", [])}

    def extract_price(self, data) -> float:
        if "data" not in data or "price" not in data["data"]:
            logging.error(f"Missing 'price' in KuCoin response: {data}")
            raise ValueError(f"Missing 'price' field: {data}")
        return float(data["data"]["price"])

    def format_symbol(self, base_currency: str, quote_currency: str) -> str:
        return f"{base_currency}-{quote_currency}".upper()
