from fastapi import Header, HTTPException


def current_user_id(authorization: str | None = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.removeprefix("Bearer ")
    if not token.startswith("user:"):
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        user_id = int(token.removeprefix("user:"))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if user_id <= 0:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id
