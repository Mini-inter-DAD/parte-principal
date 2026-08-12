import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import requests

try:
    from database.connection import engine
except ModuleNotFoundError:
    from connection import engine
from database.pipeline_state import read_state
from pipeline.fingerprints import current_pipeline_state


def is_up_to_date() -> bool:
    try:
        current = current_pipeline_state()
    except requests.RequestException as exc:
        print(f"[verify] openfootball indisponível ({exc}); assumindo dados inalterados")
        return True

    with engine.begin() as conn:
        stored = read_state(conn)

    if stored == current:
        print("[verify] Banco já contém os dados do pipeline atual")
        return True

    print("[verify] Fontes de dados mudaram; o pipeline será executado")
    return False


def main() -> None:
    sys.exit(0 if is_up_to_date() else 1)


if __name__ == "__main__":
    main()
