from pydantic import BaseModel


class PlayerResponse(BaseModel):
    id: int
    ea_id: int | None = None
    name: str
    country: str
    nationality: str
    nationality_pt: str | None = None
    country_code: str | None = None
    position: str
    overall: int
    ovr: int
    club: str | None = None
    photo_url: str | None = None
    photo: str | None = None
    dominant_foot: str | None = None
    height: int | None = None
    price: int
    section: str | None = None
