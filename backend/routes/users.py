from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.schemas.user_schema import AuthResponse, UserCreate, UserLogin, UserResponse
from backend.services import user_service
from backend.services.errors import BusinessRuleError, ConflictError, NotFoundError
from database.connection import get_db

router = APIRouter(tags=["users", "auth"])


def _create_user(request: UserCreate, db: Session):
    try:
        return user_service.create_user(
            db,
            username=request.username,
            password=request.password,
            email=request.email,
        )
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except BusinessRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(request: UserCreate, db: Session = Depends(get_db)):
    return _create_user(request, db)


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    try:
        return user_service.get_user(db, user_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/auth/register", response_model=AuthResponse, status_code=201)
def register(request: UserCreate, db: Session = Depends(get_db)):
    user = _create_user(request, db)
    return {"token": f"user:{user['id']}", "user": user}


@router.post("/auth/login", response_model=AuthResponse)
def login(request: UserLogin, db: Session = Depends(get_db)):
    try:
        return user_service.authenticate(
            db,
            username=request.username,
            password=request.password,
        )
    except BusinessRuleError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.post("/auth/forgot-password")
def forgot_password(username: str, db: Session = Depends(get_db)):
    if user_service.get_user_by_username(db, username) is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Password recovery is not available in the MVP"}
