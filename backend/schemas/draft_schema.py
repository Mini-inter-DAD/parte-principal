from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PenaltyZone = Literal[
    "top_left",
    "top_center",
    "top_right",
    "bottom_left",
    "bottom_right",
]
PenaltyTurn = Literal["user_shoot", "user_save"]


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
    model_config = ConfigDict(extra="forbid")

    user_id: int = Field(gt=0)
    opponent_id: str | None = None
    stage: str | None = None


class DraftGoalEventResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    player_id: str = Field(alias="playerId")
    player_name: str = Field(alias="playerName")
    minute: int = Field(ge=0, le=120)
    position: str | None = None
    team: Literal["USER", "OPPONENT"]
    type: Literal["goal"] = "goal"


class DraftCampaignResponse(BaseModel):
    phase_index: int = Field(ge=0, le=7)
    phase: str
    status: Literal["ACTIVE", "COMPLETED", "ELIMINATED"]
    group_matches: int = Field(ge=0, le=3)
    group_points: int = Field(ge=0)
    group_losses: int = Field(ge=0, le=3)
    can_play: bool


class DraftPenaltyStateResponse(BaseModel):
    shootout_id: int
    match_id: int
    current_turn: PenaltyTurn
    shooter_name: str
    goalkeeper_name: str
    user_penalties: int = Field(ge=0)
    opponent_penalties: int = Field(ge=0)
    user_attempts: int = Field(ge=0)
    opponent_attempts: int = Field(ge=0)
    available_zones: list[PenaltyZone]
    blocked_zones: list[PenaltyZone]
    decision_time_seconds: int = Field(ge=3, le=8)
    is_finished: bool
    winner: Literal["USER", "OPPONENT"] | None = None


class DraftPenaltyShootRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: int = Field(gt=0)
    match_id: int = Field(gt=0)
    shoot_zone: PenaltyZone


class DraftPenaltySaveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: int = Field(gt=0)
    match_id: int = Field(gt=0)
    dive_zone: PenaltyZone


class DraftPenaltyAttemptResponse(DraftPenaltyStateResponse):
    turn: PenaltyTurn
    attempt_shooter_name: str
    attempt_goalkeeper_name: str
    shoot_zone: PenaltyZone
    keeper_dive_zone: PenaltyZone
    scored: bool
    next_turn: PenaltyTurn | None = None
    result: Literal["W", "L"] | None = None
    result_label: str | None = None
    coins_earned: int = Field(ge=0)
    new_balance: int = Field(ge=0)
    campaign: DraftCampaignResponse | None = None


class DraftScoreResponse(BaseModel):
    user: int
    opponent: int


class DraftPlayResponse(BaseModel):
    match_id: int
    user_id: int
    team_name: str
    user_ovr: int
    opponent: DraftOpponentResponse
    stage: str
    stage_label: str
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
    requires_penalties: bool = False
    penalty: DraftPenaltyStateResponse | None = None


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
    decided_on_penalties: bool = False
    penalties_user_score: int | None = None
    penalties_opponent_score: int | None = None


class DraftCampaignStateResponse(DraftCampaignResponse):
    user_id: int
