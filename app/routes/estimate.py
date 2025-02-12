import logging
from typing import Dict
import asyncio
from fastapi import APIRouter, HTTPException
from app.services.exchange_registry import EXCHANGES
from app.models.request_models import EstimateRequest
from app.models.response_models import EstimateResponse

logging.basicConfig(level=logging.INFO)

router = APIRouter()

async def get_best_exchange(input_amount: float, exchange_rates: Dict[str, float]):
    if not exchange_rates:
        raise HTTPException(status_code=500, detail="No exchange rates available")

    best_exchange = max(exchange_rates, key=exchange_rates.get)
    output_amount = input_amount * exchange_rates[best_exchange]
    return best_exchange, output_amount

@router.post("/")
async def estimate(request: EstimateRequest):
    async def fetch_rate(exchange):
        try:
            rate_data = await exchange.get_price(request.inputCurrency, request.outputCurrency)
            if rate_data and "rate" in rate_data and rate_data["rate"] > 0:
                return exchange.get_name(), rate_data["rate"]
        except Exception as e:
            logging.error(f"Error fetching rates from {exchange.get_name()} ({request.inputCurrency} → {request.outputCurrency}): {e}")
        return None

    exchange_tasks = [fetch_rate(exchange) for exchange in EXCHANGES]
    results = await asyncio.gather(*exchange_tasks)

    exchange_rates = {name: rate for name, rate in results if name}

    if not exchange_rates:
        raise HTTPException(status_code=500, detail="Failed to fetch rates from all exchanges")

    exchange_name, output_amount = await get_best_exchange(request.inputAmount, exchange_rates)
    return EstimateResponse(exchangeName=exchange_name, outputAmount=output_amount)
