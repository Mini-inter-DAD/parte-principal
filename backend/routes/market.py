from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.schemas.market_schema import MarketBuyRequest, PurchaseResponse
from backend.schemas.player_schema import PlayerResponse
from backend.services import market_service
from backend.services.errors import BusinessRuleError, ConflictError, NotFoundError
from database.connection import get_db

router = APIRouter(prefix="/market", tags=["market"])


def _list_market(
    q: str | None,
    nation: str | None,
    position: str | None,
    ovr_min: int | None,
    ovr_max: int | None,
    price_min: int | None,
    price_max: int | None,
    section: str | None,
    db: Session,
):
    try:
        return market_service.list_market(
            db,
            query=q,
            country=nation,
            position=position,
            overall_min=ovr_min,
            overall_max=ovr_max,
            price_min=price_min,
            price_max=price_max,
            section=section,
        )
    except BusinessRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("", response_model=list[PlayerResponse], summary="List available market players")
@router.get("/players", response_model=list[PlayerResponse], summary="List available market players")
def list_market_players(
    q: str | None = None,
    nation: str | None = None,
    position: str | None = None,
    ovr_min: int | None = Query(default=None, alias="ovrMin", ge=1, le=99),
    ovr_max: int | None = Query(default=None, alias="ovrMax", ge=1, le=99),
    price_min: int | None = Query(default=None, alias="priceMin", ge=0),
    price_max: int | None = Query(default=None, alias="priceMax", ge=0),
    section: str | None = None,
    db: Session = Depends(get_db),
):
    return _list_market(
        q, nation, position, ovr_min, ovr_max, price_min, price_max, section, db
    )


@router.get("/sections")
def list_sections():
    return market_service.list_sections()


@router.post("/buy", response_model=PurchaseResponse)
def buy_player(request: MarketBuyRequest, db: Session = Depends(get_db)):
    try:
        return market_service.buy_player(
            db,
            user_id=request.user_id,
            player_id=request.player_id,
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
