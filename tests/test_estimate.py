import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_estimate():
    response = client.post(
        "/estimate/",
        json={"inputAmount": 0.5, "inputCurrency": "BTC", "outputCurrency": "USDT"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "exchangeName" in data
    assert "outputAmount" in data
    assert isinstance(data["outputAmount"], float)
