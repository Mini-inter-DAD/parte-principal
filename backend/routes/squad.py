from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.schemas.market_schema import PurchaseResponse
from backend.schemas.squad_schema import (
    SquadPlayerResponse,
    StarterUpdate,
    AssignPositionRequest,
    AssignPositionResponse,
    MoveToBenchRequest,
    MoveToBenchResponse,
    SubstituteRequest,
    SubstituteResponse,
)
from backend.services import market_service, squad_service
from backend.services.auth_service import current_user_id
from backend.services.errors import BusinessRuleError, ConflictError, NotFoundError
from database.connection import get_db

router = APIRouter(prefix="/squad", tags=["squad"])


def _service_error(exc: Exception):
    if isinstance(exc, NotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, ConflictError):
        return HTTPException(status_code=409, detail=str(exc))
    return HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=list[SquadPlayerResponse])
def get_current_squad(
    user_id: int = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    try:
        return squad_service.list_squad(db, user_id)
    except (NotFoundError, BusinessRuleError) as exc:
        raise _service_error(exc) from exc


@router.patch("/substitute", response_model=SubstituteResponse)
def substitute_players(request: SubstituteRequest, db: Session = Depends(get_db)):
    try:
        return squad_service.substitute_players(
            db,
            user_id=request.user_id,
            starter_player_id=request.starter_player_id,
            bench_player_id=request.bench_player_id,
        )
    except (NotFoundError, ConflictError, BusinessRuleError) as exc:
        raise _service_error(exc) from exc


@router.patch("/assign-position", response_model=AssignPositionResponse)
def assign_position(request: AssignPositionRequest, db: Session = Depends(get_db)):
    try:
        return squad_service.assign_position(
            db,
            user_id=request.user_id,
            player_id=request.player_id,
            target_position=request.target_position,
        )
    except (NotFoundError, ConflictError, BusinessRuleError) as exc:
        raise _service_error(exc) from exc


@router.patch("/move-to-bench", response_model=MoveToBenchResponse)
def move_to_bench(request: MoveToBenchRequest, db: Session = Depends(get_db)):
    try:
        return squad_service.move_to_bench(
            db,
            user_id=request.user_id,
            player_id=request.player_id,
        )
    except (NotFoundError, ConflictError, BusinessRuleError) as exc:
        raise _service_error(exc) from exc


@router.get("/{user_id}", response_model=list[SquadPlayerResponse])
def get_squad(user_id: int, db: Session = Depends(get_db)):
    try:
        return squad_service.list_squad(db, user_id)
    except NotFoundError as exc:
        raise _service_error(exc) from exc


@router.post("/buy/{player_id}", response_model=PurchaseResponse)
def buy_for_current_user(
    player_id: int,
    user_id: int = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    try:
        return market_service.buy_player(db, user_id=user_id, player_id=player_id)
    except (NotFoundError, ConflictError, BusinessRuleError) as exc:
        raise _service_error(exc) from exc


@router.patch("/starter")
def set_starter(request: StarterUpdate, db: Session = Depends(get_db)):
    try:
        return squad_service.set_starter(
            db,
            user_id=request.user_id,
            player_id=request.player_id,
            is_starter=request.is_starter,
            squad_position=request.squad_position,
        )
    except (NotFoundError, BusinessRuleError) as exc:
        raise _service_error(exc) from exc


@router.patch("/starter/{player_id}")
def set_current_user_starter(
    player_id: int,
    user_id: int = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    try:
        return squad_service.set_starter(
            db,
            user_id=user_id,
            player_id=player_id,
            is_starter=True,
        )
    except NotFoundError as exc:
        raise _service_error(exc) from exc
