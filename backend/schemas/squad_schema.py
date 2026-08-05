from datetime import datetime

from pydantic import BaseModel, Field

from backend.schemas.player_schema import PlayerResponse


class SquadPlayerResponse(PlayerResponse):
    is_starter: bool
    squad_position: str | None = None
    acquired_at: datetime


class StarterUpdate(BaseModel):
    user_id: int = Field(gt=0)
    player_id: int = Field(gt=0)
    is_starter: bool = True
    squad_position: str | None = Field(default=None, max_length=5)
