import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app 

client = TestClient(app)

@pytest.mark.asyncio
async def test_get_rates():
    response = client.post(
        "/getRates",
        json={"baseCurrency": "BTC", "quoteCurrency": "ETH"},
    )
    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
