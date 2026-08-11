from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.schemas.draft_schema import (
    DraftCampaignStateResponse,
    DraftHistoryResponse,
    DraftOpponentResponse,
    DraftPenaltyAttemptResponse,
    DraftPenaltySaveRequest,
    DraftPenaltyShootRequest,
    DraftPlayRequest,
    DraftPlayResponse,
)
from backend.services import draft_service
from backend.services.errors import (
    BusinessRuleError,
    InvalidOpponentError,
    InvalidStageError,
    NotFoundError,
)
from database.connection import get_db

router = APIRouter(prefix="/draft", tags=["draft"])


@router.get("/opponents", response_model=list[DraftOpponentResponse])
def get_opponents(db: Session = Depends(get_db)):
    return draft_service.list_opponents(db)


def _play_draft(request: DraftPlayRequest, db: Session, mode: str):
    try:
        return draft_service.play_draft(
            db,
            user_id=request.user_id,
            requested_opponent_id=request.opponent_id,
            requested_stage=request.stage,
            mode=mode,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidStageError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except InvalidOpponentError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/play", response_model=DraftPlayResponse)
def play_draft(request: DraftPlayRequest, db: Session = Depends(get_db)):
    return _play_draft(request, db, "cup")


@router.post("/friendly/play", response_model=DraftPlayResponse)
def play_friendly(request: DraftPlayRequest, db: Session = Depends(get_db)):
    return _play_draft(request, db, "friendly")


@router.get("/penalty/active/{user_id}", response_model=DraftPlayResponse | None)
def get_active_penalty(user_id: int, db: Session = Depends(get_db)):
    try:
        return draft_service.get_active_penalty_match(db, user_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidOpponentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/penalty/shoot", response_model=DraftPenaltyAttemptResponse)
def shoot_penalty(request: DraftPenaltyShootRequest, db: Session = Depends(get_db)):
    try:
        return draft_service.shoot_penalty(
            db,
            user_id=request.user_id,
            match_id=request.match_id,
            shoot_zone=request.shoot_zone,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidOpponentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/penalty/save", response_model=DraftPenaltyAttemptResponse)
def save_penalty(request: DraftPenaltySaveRequest, db: Session = Depends(get_db)):
    try:
        return draft_service.save_penalty(
            db,
            user_id=request.user_id,
            match_id=request.match_id,
            dive_zone=request.dive_zone,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidOpponentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/history/{user_id}", response_model=list[DraftHistoryResponse])
def get_history(
    user_id: int,
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        return draft_service.get_history(db, user_id, limit=limit, offset=offset)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/campaign/{user_id}", response_model=DraftCampaignStateResponse)
def get_campaign(user_id: int, db: Session = Depends(get_db)):
    try:
        return draft_service.get_campaign_state(db, user_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/campaign/{user_id}/restart", response_model=DraftCampaignStateResponse)
def restart_campaign(user_id: int, db: Session = Depends(get_db)):
    try:
        return draft_service.restart_campaign(db, user_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
