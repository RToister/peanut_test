import logging
from fastapi import FastAPI
from app.config import SUPPORTED_EXCHANGES
from app.routes.estimate import router as estimate_router
from app.routes.get_rates import router as get_rates_router

app = FastAPI(
    title="Peanut.Trade TEST API",
    description="API для отримання найкращих курсів обміну криптовалют",
    version="1.3"
)

logging.info("Запуск Peanut.Trade API")

app.include_router(estimate_router, prefix="/estimate", tags=["Estimate"])
app.include_router(get_rates_router, prefix="")

@app.get("/")
def read_root():
    return {
        "message": "Peanut.Trade API is running",
        "supported_exchanges": SUPPORTED_EXCHANGES
    }
