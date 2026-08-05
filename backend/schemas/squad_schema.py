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


class SubstituteRequest(BaseModel):
    user_id: int = Field(gt=0)
    starter_player_id: int = Field(gt=0)
    bench_player_id: int = Field(gt=0)


class SubstituteResponse(BaseModel):
    message: str
    starter_out: int
    starter_in: int


class AssignPositionRequest(BaseModel):
    user_id: int = Field(gt=0)
    player_id: int = Field(gt=0)
    target_position: str = Field(min_length=1, max_length=5)


class AssignPositionResponse(BaseModel):
    message: str
    player_id: int
    target_position: str
    replaced_player_id: int | None = None


class MoveToBenchRequest(BaseModel):
    user_id: int = Field(gt=0)
    player_id: int = Field(gt=0)


class MoveToBenchResponse(BaseModel):
    message: str
    player_id: int
