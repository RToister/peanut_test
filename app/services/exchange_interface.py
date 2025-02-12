from abc import ABC, abstractmethod
from typing import Dict

class ExchangeInterface(ABC):

    @abstractmethod
    async def get_price(self, base_currency: str, quote_currency: str) -> Dict[str, float]:
        """
        Отримати останню ціну для заданої валютної пари.

        :param base_currency: Базова валюта (наприклад, BTC)
        :param quote_currency: Валюта котирування (наприклад, USDT)
        :return: Словник з курсом {"rate": float}
        """
        pass

    @abstractmethod
    def get_name(self) -> str:
        """
        Отримати ім'я біржі.

        :return: Назва біржі
        """
        pass
