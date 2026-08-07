from datetime import datetime

from pydantic import BaseModel, Field


class DraftOpponentResponse(BaseModel):
    id: str
    name: str
    code: str
    overall: int


class DraftPlayRequest(BaseModel):
    user_id: int = Field(gt=0)
    opponent_id: str | None = None


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


class DraftHistoryResponse(BaseModel):
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
