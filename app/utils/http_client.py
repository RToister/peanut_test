import httpx
from typing import Dict

class HttpClient:
    @staticmethod
    async def fetch(url: str) -> Dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
