from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.schemas.draft_schema import (
    DraftCampaignStateResponse,
    DraftHistoryResponse,
    DraftOpponentResponse,
    DraftPlayRequest,
    DraftPlayResponse,
)
from backend.services import draft_service
from backend.services.errors import BusinessRuleError, NotFoundError
from database.connection import get_db

router = APIRouter(prefix="/draft", tags=["draft"])


@router.get("/opponents", response_model=list[DraftOpponentResponse])
def get_opponents():
    return draft_service.list_opponents()


@router.post("/play", response_model=DraftPlayResponse)
def play_draft(request: DraftPlayRequest, db: Session = Depends(get_db)):
    try:
        return draft_service.play_draft(
            db,
            user_id=request.user_id,
            opponent_id=request.opponent_id,
            mode=request.mode,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        db.rollback()
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
