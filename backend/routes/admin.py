from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from sqlalchemy.orm import Session

from backend.schemas.admin_schema import (
    AdminUserResponse,
    PaginatedUsersResponse,
    UserDashboardResponse,
)
from backend.schemas.metrics_schema import UserMetricsResponse
from backend.services import admin_service
from backend.services.auth_service import current_admin_id, extract_bearer_token
from backend.services.errors import BusinessRuleError, NotFoundError
from database.connection import get_db


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/auth/logout", status_code=204)
def logout_admin(
    authorization: str | None = Header(default=None),
    _admin_id: int = Depends(current_admin_id),
    db: Session = Depends(get_db),
):
    admin_service.logout_admin(
        db,
        token=extract_bearer_token(authorization),
    )
    return Response(status_code=204)


@router.get("/metrics/users", response_model=UserMetricsResponse)
def user_metrics(
    month: str = Query(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    _admin_id: int = Depends(current_admin_id),
    db: Session = Depends(get_db),
):
    try:
        return admin_service.get_user_metrics(db, month=month)
    except BusinessRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/dashboard", response_model=UserDashboardResponse)
def user_dashboard(
    month: str = Query(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    _admin_id: int = Depends(current_admin_id),
    db: Session = Depends(get_db),
):
    try:
        return admin_service.get_user_dashboard(db, month=month)
    except BusinessRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/users", response_model=list[AdminUserResponse] | PaginatedUsersResponse)
def users_created_in_month(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _admin_id: int = Depends(current_admin_id),
    db: Session = Depends(get_db),
):
    try:
        return admin_service.list_users(db, month=month, limit=limit, offset=offset)
    except BusinessRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/users/{user_id}", status_code=204)
def ban_user(
    user_id: int,
    _admin_id: int = Depends(current_admin_id),
    db: Session = Depends(get_db),
):
    try:
        admin_service.ban_user(db, user_id=user_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(status_code=204)
