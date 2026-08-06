from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.schemas.player_schema import PlayerResponse
from backend.services import player_service
from backend.services.errors import NotFoundError
from database.connection import get_db

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[PlayerResponse])
def list_players(
    name: str | None = None,
    country: str | None = None,
    position: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return player_service.list_players(
        db,
        name=name,
        country=country,
        position=position,
        limit=limit,
    )


@router.get("/search", response_model=list[PlayerResponse])
def search_players(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    return player_service.search_players(db, q)


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    try:
        return player_service.get_player(db, player_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
