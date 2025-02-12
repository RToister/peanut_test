from pydantic import BaseModel, Field
from typing import List

class RateResponseItem(BaseModel):
    exchangeName: str = Field(..., description="Назва біржі")
    rate: float = Field(..., gt=0, description="Курс обміну")

class RateResponse(BaseModel):
    rates: List[RateResponseItem] = Field(..., description="Список курсів з різних бірж")

class EstimateResponse(BaseModel):
    exchangeName: str = Field(..., description="Назва біржі")
    outputAmount: float = Field(..., gt=0, description="Розрахункова сума після обміну")
