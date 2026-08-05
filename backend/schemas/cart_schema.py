from pydantic import BaseModel, Field

from backend.schemas.player_schema import PlayerResponse


class CartItemRequest(BaseModel):
    user_id: int = Field(gt=0)
    player_id: int = Field(gt=0)


class CartCheckoutRequest(BaseModel):
    user_id: int = Field(gt=0)


class CartResponse(BaseModel):
    user_id: int
    items: list[PlayerResponse]
    total: int
    coins: int


class CartCheckoutResponse(BaseModel):
    message: str
    user_id: int
    player_ids: list[int]
    total: int
    coins: int
