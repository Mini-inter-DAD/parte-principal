from pydantic import BaseModel, Field


class MarketBuyRequest(BaseModel):
    user_id: int = Field(gt=0)
    player_id: int = Field(gt=0)


class PurchaseResponse(BaseModel):
    message: str
    user_id: int
    player_id: int
    price_paid: int
    coins: int
