from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.schemas.cart_schema import (
    CartCheckoutRequest,
    CartCheckoutResponse,
    CartItemRequest,
    CartResponse,
)
from backend.services import cart_service
from backend.services.errors import BusinessRuleError, ConflictError, NotFoundError
from database.connection import get_db

router = APIRouter(prefix="/cart", tags=["cart"])


def _service_error(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, ConflictError):
        return HTTPException(status_code=409, detail=str(exc))
    return HTTPException(status_code=400, detail=str(exc))


@router.get("/{user_id}", response_model=CartResponse)
def get_cart(user_id: int, db: Session = Depends(get_db)):
    try:
        return cart_service.list_cart(db, user_id)
    except NotFoundError as exc:
        raise _service_error(exc) from exc


@router.post("/add", response_model=CartResponse)
def add_cart_item(request: CartItemRequest, db: Session = Depends(get_db)):
    try:
        return cart_service.add_item(
            db,
            user_id=request.user_id,
            player_id=request.player_id,
        )
    except (NotFoundError, ConflictError) as exc:
        raise _service_error(exc) from exc


@router.delete("/remove", response_model=CartResponse)
def remove_cart_item(request: CartItemRequest, db: Session = Depends(get_db)):
    try:
        return cart_service.remove_item(
            db,
            user_id=request.user_id,
            player_id=request.player_id,
        )
    except NotFoundError as exc:
        raise _service_error(exc) from exc


@router.delete("/clear/{user_id}", response_model=CartResponse)
def clear_cart(user_id: int, db: Session = Depends(get_db)):
    try:
        return cart_service.clear_cart(db, user_id)
    except NotFoundError as exc:
        raise _service_error(exc) from exc


@router.post("/checkout", response_model=CartCheckoutResponse)
def checkout_cart(request: CartCheckoutRequest, db: Session = Depends(get_db)):
    try:
        return cart_service.checkout(db, request.user_id)
    except (NotFoundError, ConflictError, BusinessRuleError) as exc:
        raise _service_error(exc) from exc
