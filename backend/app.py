from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.players import router as players_router
from backend.routes.market import router as market_router
from backend.routes.users import router as users_router
from backend.routes.squad import router as squad_router
from backend.routes.cart import router as cart_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players_router)
app.include_router(market_router)
app.include_router(users_router)
app.include_router(squad_router)
app.include_router(cart_router)


@app.get("/")
def root():
    return {"message": "Dream Cup API funcionando"}

@app.get("/health")
def health():
    return {"status": "ok"}
