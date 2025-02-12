import pytest
from app.services.kucoin_client import KuCoin

kucoin = KuCoin()

@pytest.mark.asyncio
async def test_kucoin_get_price():
    response = await kucoin.get_price("BTC", "USDT")
    assert isinstance(response, dict)
    assert "rate" in response
    assert response["rate"] > 0
