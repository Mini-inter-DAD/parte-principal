from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.routes.players import router as players_router
from backend.routes.market import router as market_router
from backend.routes.users import router as users_router
from backend.routes.squad import router as squad_router
from backend.routes.cart import router as cart_router
from backend.routes.draft import router as draft_router
from backend.routes.admin import router as admin_router
from database.run_migrations import main as run_migrations

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend-main"

@asynccontextmanager
async def lifespan(_app: FastAPI):
    run_migrations()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players_router, prefix="/api")
app.include_router(market_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(squad_router, prefix="/api")
app.include_router(cart_router, prefix="/api")
app.include_router(draft_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
def root():
    return FileResponse(FRONTEND / "index.html")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "Dream Cup API funcionando"
    }


app.mount("/", StaticFiles(directory=FRONTEND))
