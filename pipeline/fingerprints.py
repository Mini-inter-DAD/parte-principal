import json
from pathlib import Path

import requests

from pipeline.cache import file_hash, text_hash

ROOT = Path(__file__).resolve().parent.parent

SQUADS_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.squads.json"

EA_CSV = ROOT / "data" / "ea_fc26_players.csv"
MISSING_JSON = ROOT / "data" / "missing.json"

MATCH_VERSION = "1"

FILL_MISSING_MODEL = "llama-3.3-70b-versatile"
FILL_MISSING_TEMPERATURE = 0.1
FILL_MISSING_SYSTEM_PROMPT = (
    "You are a football analyst. For each player, estimate their EA FC 26 overall rating "
    "as an integer between 55 and 91. Base it on real-world reputation, league level, and performance. "
    "Respond ONLY with a JSON array of integers in the same order as the input. "
    "Example: [72, 68, 81, 75]. No explanation, no text, just the array."
)


def build_squads_fingerprint(squads) -> str:
    return text_hash(
        json.dumps(squads, ensure_ascii=False, sort_keys=True)
        + file_hash(EA_CSV)
        + MATCH_VERSION
    )


def fill_missing_inputs_fingerprint() -> str:
    return text_hash(
        file_hash(MISSING_JSON)
        + text_hash(FILL_MISSING_SYSTEM_PROMPT)
        + FILL_MISSING_MODEL
        + str(FILL_MISSING_TEMPERATURE)
    )


def fetch_squads():
    return requests.get(SQUADS_URL).json()


def current_pipeline_state() -> dict:
    squads = fetch_squads()
    return {
        "build_squads": build_squads_fingerprint(squads),
        "fill_missing_inputs": fill_missing_inputs_fingerprint(),
    }
