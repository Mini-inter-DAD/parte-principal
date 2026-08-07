from pydantic import BaseModel


class UserMetricsResponse(BaseModel):
    month: str
    new_users: int
    mau: int
