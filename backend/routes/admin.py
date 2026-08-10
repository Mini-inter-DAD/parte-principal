from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from sqlalchemy.orm import Session

from backend.schemas.metrics_schema import UserMetricsResponse
from backend.services import admin_service
from backend.services.auth_service import current_admin_id, extract_bearer_token
from backend.services.errors import BusinessRuleError
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
