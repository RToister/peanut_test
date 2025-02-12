import logging
import aiohttp
from abc import ABC
from app.services.exchange_interface import ExchangeInterface

class BaseExchange(ExchangeInterface, ABC):
    def __init__(self, name: str, api_url: str, symbols_url: str):
        self.name = name
        self.api_url = api_url
        self.symbols_url = symbols_url

    def get_name(self) -> str:
        return self.name

    async def is_valid_symbol(self, symbol: str) -> bool:
        async with aiohttp.ClientSession() as session:
            async with session.get(self.symbols_url) as response:
                if response.status != 200:
                    logging.error(f"{self.name} symbols error {response.status}: {await response.text()}")
                    return False

                data = await response.json()
                symbols = self.extract_symbols(data)
                return symbol in symbols

    async def fetch_price(self, symbol: str) -> float:
        url = f"{self.api_url}?symbol={symbol}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    logging.error(f"{self.name} API error {response.status}: {await response.text()}")
                    raise ValueError(f"{self.name} API error: {await response.text()}")

                data = await response.json()
                logging.info(f"{self.name} API response for {symbol}: {data}")

                return self.extract_price(data)

    async def get_price(self, base_currency: str, quote_currency: str):
        symbol = self.format_symbol(base_currency, quote_currency)
        if await self.is_valid_symbol(symbol):
            rate = await self.fetch_price(symbol)
            return {"rate": rate}
        else:
            reversed_symbol = self.format_symbol(quote_currency, base_currency)
            if await self.is_valid_symbol(reversed_symbol):
                reversed_rate = await self.fetch_price(reversed_symbol)
                if reversed_rate == 0:
                    raise ValueError(f"Received zero price for symbol {reversed_symbol}")
                return {"rate": 1 / reversed_rate}
            else:
                logging.error(f"Invalid {self.name} symbols: {symbol} та {reversed_symbol}")
                raise ValueError(f"Invalid {self.name} symbols: {symbol} та {reversed_symbol}")

    def extract_symbols(self, data) -> set:
        """ Метод, який повинні реалізувати дочірні класи для отримання списку валютних пар """
        raise NotImplementedError

    def extract_price(self, data) -> float:
        """ Метод, який повинні реалізувати дочірні класи для отримання ціни """
        raise NotImplementedError

    def format_symbol(self, base_currency: str, quote_currency: str) -> str:
        """ Метод для форматування торгової пари (наприклад, BTCUSDT або BTC-USDT) """
        raise NotImplementedError
