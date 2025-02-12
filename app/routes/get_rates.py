import logging
import asyncio
from fastapi import APIRouter, HTTPException
from app.models.request_models import GetRatesRequest
from app.models.response_models import RateResponse, RateResponseItem
from app.services.exchange_registry import EXCHANGES

logging.basicConfig(level=logging.INFO)

router = APIRouter()

@router.post("/getRates")
async def get_rates(request: GetRatesRequest):
    logging.info(f"Received request for {request.baseCurrency} → {request.quoteCurrency}")

    async def fetch_rate(exchange):
        try:
            logging.info(f"Fetching rate from {exchange.get_name()} for {request.baseCurrency} → {request.quoteCurrency}...")
            rate_data = await exchange.get_price(request.baseCurrency, request.quoteCurrency)
            logging.info(f"Response from {exchange.get_name()}: {rate_data}")

            if rate_data and "rate" in rate_data and rate_data["rate"] > 0:
                return RateResponseItem(exchangeName=exchange.get_name(), rate=rate_data["rate"])
        except Exception as e:
            logging.error(f"Error fetching rate from {exchange.get_name()}: {e}", exc_info=True)
        return None

    rate_tasks = [fetch_rate(exchange) for exchange in EXCHANGES]
    results = await asyncio.gather(*rate_tasks)

    rates = [rate for rate in results if rate]  # Видаляємо `None`

    if not rates:
        logging.warning(f"No valid rates found for {request.baseCurrency} → {request.quoteCurrency}")
        raise HTTPException(status_code=204, detail="No rates available")

    logging.info(f"Returning rates: {rates}")
    return RateResponse(rates=rates)
