import csv
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import text

try:
    from database.connection import engine
except ModuleNotFoundError:
    from connection import engine
from database.pipeline_state import write_state
from backend.services.player_pricing import calculate_player_price
from backend.services.player_formatters import normalize_o_slash
from pipeline.fingerprints import current_pipeline_state

OUTPUT_FILE = PROJECT_ROOT / "output" / "players.json"
ARTIFACT_FILE = PROJECT_ROOT / "artifacts" / "players.json"
PLAYERS_FILE = OUTPUT_FILE if OUTPUT_FILE.exists() else ARTIFACT_FILE
EA_PLAYERS_FILE = PROJECT_ROOT / "data" / "ea_fc26_players.csv"

PLAYER_EA_ID_OVERRIDES = {
    ("brazil", "alisson", "GK"): 212831,
}


def normalize_match_value(value: object) -> str:
    return " ".join(str(value or "").strip().casefold().split())


def format_player_name(value: object) -> str | None:
    raw_name = " ".join(str(value or "").strip().split())
    if not raw_name:
        return None
    raw_name = normalize_o_slash(raw_name)
    if any(character.isupper() for character in raw_name):
        return raw_name
    return " ".join(
        part[:1].upper() + part[1:].lower()
        for part in raw_name.split()
    )


def corrected_ea_id(player: dict) -> int | None:
    raw_ea_id = player.get("ea_id")
    source_ea_id = int(raw_ea_id) if raw_ea_id is not None else None
    key = (
        normalize_match_value(player.get("nationality") or player.get("nation")),
        normalize_match_value(player.get("wc_name") or player.get("name")),
        str(player.get("position") or "").strip().upper(),
    )
    return PLAYER_EA_ID_OVERRIDES.get(key, source_ea_id)


def calculate_price(overall: int) -> int:
    return calculate_player_price(overall)


def load_ea_positions() -> dict[int, str]:
    with open(EA_PLAYERS_FILE, encoding="utf-8-sig", newline="") as csv_file:
        return {
            int(row["id"]): row["position"].strip().upper()
            for row in csv.DictReader(csv_file)
            if row.get("id") and row.get("position")
        }


def seed_players():

    if not PLAYERS_FILE.exists():
        raise FileNotFoundError(
            "No player data found in output/players.json or artifacts/players.json"
        )

    with open(PLAYERS_FILE, encoding="utf-8") as f:
        players = json.load(f)
    ea_positions = load_ea_positions()

    inserted = 0
    total = len(players)

    with engine.begin() as conn:

        print(f"Processando jogadores...  0/{total}")
        for player in players:
            raw_source_ea_id = player.get("ea_id")
            source_ea_id = int(raw_source_ea_id) if raw_source_ea_id is not None else None
            corrected_id = corrected_ea_id(player)
            national_team = player.get("nation") or player.get("nationality")

            if source_ea_id is not None and corrected_id != source_ea_id:
                conn.execute(
                    text("""
                        DELETE FROM national_team_rosters
                        WHERE national_team = :national_team
                          AND player_id IN (
                              SELECT id FROM players WHERE ea_id = :source_ea_id
                          )
                    """),
                    {
                        "national_team": national_team,
                        "source_ea_id": source_ea_id,
                    },
                )

            player_data = {
                "ea_id": corrected_id,
                "name": format_player_name(player.get("wc_name") or player.get("name")),
                "country": player.get("nationality") or player.get("nation"),
                "national_team": national_team,
                "position": ea_positions.get(
                    corrected_id,
                    player.get("position"),
                ),
                "overall": player.get("overall"),
                "club": player.get("club"),
                "photo_url": player.get("photo"),
                "price": calculate_price(player.get("overall", 70)),
            }

            if player_data["ea_id"] is None:
                existing_id = conn.execute(
                    text("""
                        SELECT id
                        FROM players
                        WHERE ea_id IS NULL
                          AND LOWER(name) = LOWER(:name)
                          AND country = :country
                          AND national_team = :national_team
                          AND position = :position
                          AND overall = :overall
                          AND club IS NOT DISTINCT FROM :club
                          AND photo_url IS NOT DISTINCT FROM :photo_url
                        LIMIT 1
                    """),
                    player_data,
                ).scalar()
                if existing_id is not None:
                    conn.execute(
                        text("""
                            UPDATE players
                            SET name = :name,
                                country = :country,
                                national_team = :national_team,
                                price = :price
                            WHERE id = :id
                        """),
                        {
                            "id": existing_id,
                            "name": player_data["name"],
                            "country": player_data["country"],
                            "national_team": player_data["national_team"],
                            "price": player_data["price"],
                        },
                    )
                    conn.execute(
                        text("""
                            INSERT INTO national_team_rosters (
                                national_team, player_id, roster_position
                            )
                            VALUES (:national_team, :player_id, :roster_position)
                            ON CONFLICT (national_team, player_id) DO UPDATE
                            SET roster_position = EXCLUDED.roster_position
                        """),
                        {
                            "national_team": player_data["national_team"],
                            "player_id": existing_id,
                            "roster_position": player_data["position"],
                        },
                    )
                    inserted += 1
                    continue

            result = conn.execute(
                text("""
                    INSERT INTO players (
                        ea_id,
                        name,
                        country,
                        national_team,
                        position,
                        overall,
                        club,
                        photo_url,
                        price
                    )
                    VALUES (
                        :ea_id,
                        :name,
                        :country,
                        :national_team,
                        :position,
                        :overall,
                        :club,
                        :photo_url,
                        :price
                    )
                    ON CONFLICT (ea_id) DO UPDATE
                    SET position = EXCLUDED.position,
                        name = EXCLUDED.name,
                        country = EXCLUDED.country,
                        national_team = EXCLUDED.national_team,
                        overall = EXCLUDED.overall,
                        club = EXCLUDED.club,
                        photo_url = EXCLUDED.photo_url,
                        price = EXCLUDED.price
                    RETURNING id
                """),
                player_data
            )
            player_id = result.scalar_one()
            conn.execute(
                text("""
                    INSERT INTO national_team_rosters (
                        national_team, player_id, roster_position
                    )
                    VALUES (:national_team, :player_id, :roster_position)
                    ON CONFLICT (national_team, player_id) DO UPDATE
                    SET roster_position = EXCLUDED.roster_position
                """),
                {
                    "national_team": player_data["national_team"],
                    "player_id": player_id,
                    "roster_position": player_data["position"],
                },
            )

            inserted += 1
            if inserted % 10 == 0:
                print(f"Processando jogadores...  {inserted}/{total}")

    print(f"Processando jogadores...  {inserted}/{total}")

    record_pipeline_state()


def record_pipeline_state() -> None:
    try:
        state = current_pipeline_state()
    except Exception as exc:
        print(
            f"[seed] Não foi possível computar fingerprints ({exc}); "
            "a próxima execução revalidará o pipeline"
        )
        return

    with engine.begin() as conn:
        write_state(conn, state)
    print("[seed] Fingerprints do pipeline registrados no banco")


if __name__ == "__main__":
    seed_players()
