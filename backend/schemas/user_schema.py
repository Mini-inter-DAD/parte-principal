from typing import Literal

from pydantic import BaseModel, Field

from backend.schemas.admin_schema import AdminResponse


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=128)
    email: str | None = Field(default=None, max_length=100)


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    coins: int


class AuthResponse(BaseModel):
    token: str
    user: UserResponse
    account_type: Literal["user"] = "user"


class LoginResponse(BaseModel):
    token: str
    account_type: Literal["user", "admin"]
    user: UserResponse | None = None
    admin: AdminResponse | None = None
