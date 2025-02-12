import logging
from app.services.exchange_client import BaseExchange

class Binance(BaseExchange):
    def __init__(self):
        super().__init__(
            name="Binance",
            api_url="https://api.binance.com/api/v3/ticker/price",
            symbols_url="https://api.binance.com/api/v3/exchangeInfo"
        )

    def extract_symbols(self, data) -> set:
        return {s["symbol"] for s in data.get("symbols", [])}

    def extract_price(self, data) -> float:
        if "price" not in data:
            logging.error(f"Missing 'price' in Binance response: {data}")
            raise ValueError(f"Missing 'price' field: {data}")
        return float(data["price"])

    def format_symbol(self, base_currency: str, quote_currency: str) -> str:
        return f"{base_currency}{quote_currency}".upper()
