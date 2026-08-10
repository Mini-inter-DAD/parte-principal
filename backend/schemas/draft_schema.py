from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DraftOpponentPlayerResponse(BaseModel):
    id: int
    name: str
    position: str
    overall: int
    club: str | None = None
    photo_url: str | None = None


class DraftOpponentResponse(BaseModel):
    id: str
    name: str
    code: str
    overall: int
    players: list[DraftOpponentPlayerResponse] = Field(default_factory=list)


class DraftPlayRequest(BaseModel):
    user_id: int = Field(gt=0)
    opponent_id: str | None = None
    mode: Literal["cup", "friendly"] = "cup"


class DraftGoalEventResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    player_id: str = Field(alias="playerId")
    player_name: str = Field(alias="playerName")
    minute: int = Field(ge=0, le=120)
    position: str | None = None
    team: Literal["USER", "OPPONENT"]


class DraftCampaignResponse(BaseModel):
    phase_index: int = Field(ge=0, le=7)
    phase: str
    status: Literal["ACTIVE", "COMPLETED", "ELIMINATED"]
    group_matches: int = Field(ge=0, le=3)
    group_points: int = Field(ge=0)
    group_losses: int = Field(ge=0, le=3)
    can_play: bool


class DraftScoreResponse(BaseModel):
    user: int
    opponent: int


class DraftPlayResponse(BaseModel):
    match_id: int
    user_id: int
    team_name: str
    user_ovr: int
    opponent: DraftOpponentResponse
    score: DraftScoreResponse
    result: str
    result_label: str
    coins_earned: int
    new_balance: int
    played_at: datetime
    mode: Literal["cup", "friendly"]
    phase_index: int | None = None
    goal_events: list[DraftGoalEventResponse]
    campaign: DraftCampaignResponse | None = None


class DraftHistoryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    user_ovr: int
    opponent_name: str
    opponent_ovr: int
    user_score: int
    opponent_score: int
    result: str
    result_label: str
    coins_earned: int
    played_at: datetime
    mode: Literal["cup", "friendly"]
    phase_index: int | None = None
    goal_events: list[DraftGoalEventResponse]


class DraftCampaignStateResponse(DraftCampaignResponse):
    user_id: int
