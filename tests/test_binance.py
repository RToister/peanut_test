import pytest
from app.services.binance_client import Binance

binance = Binance()


@pytest.mark.asyncio
async def test_binance_get_price():
    response = await binance.get_price("BTC", "USDT")

    print("Response:", response)

    assert isinstance(response, dict)
    assert "rate" in response
    assert isinstance(response["rate"], (int, float))
    assert response["rate"] > 0
