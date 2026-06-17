from pydantic import BaseModel

class Player(BaseModel):
    ea_id: int
    raw_name: str
    name: str
    common_name: str | None = None
    overall: int
    position: str
    nationality: str
    club: str
    photo: str | None = None

    @property
    def price(self):
        return self.overall ** 2