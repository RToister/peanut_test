from pydantic import BaseModel, Field

class EstimateRequest(BaseModel):
    inputAmount: float = Field(..., gt=0, description="Сума, яку для обміну")
    inputCurrency: str = Field(..., min_length=3, description="Базова валюта (наприклад, BTC)")
    outputCurrency: str = Field(..., min_length=3, description="Валюта котирування (наприклад, USDT)")

class GetRatesRequest(BaseModel):
    baseCurrency: str = Field(..., min_length=3, description="Базова валюта (наприклад, BTC)")
    quoteCurrency: str = Field(..., min_length=3, description="Валюта котирування (наприклад, USDT)")
