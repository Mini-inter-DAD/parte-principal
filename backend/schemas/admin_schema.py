from datetime import datetime

from pydantic import BaseModel


class AdminResponse(BaseModel):
    id: int
    username: str


class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    coins: int
    created_at: datetime


class PaginatedUsersResponse(BaseModel):
    users: list[AdminUserResponse]
    total: int
    limit: int
    offset: int


class UserMetricPoint(BaseModel):
    label: str
    value: int


class UserDashboardResponse(BaseModel):
    monthlyActiveUsers: list[UserMetricPoint]
    usersCreated: list[UserMetricPoint]
    activeUsersTotal: int
    createdUsersTotal: int
    availableMonths: list[str]
