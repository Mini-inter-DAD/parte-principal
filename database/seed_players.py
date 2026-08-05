import json
import csv
from pathlib import Path

from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://admin:admin@localhost:5432/dreamcup"

engine = create_engine(DATABASE_URL)

PLAYERS_FILE = Path("output/players.json")
EA_PLAYERS_FILE = Path("data/ea_fc26_players.csv")


def calculate_price(overall: int) -> int:
    return overall * 100

def load_ea_positions() -> dict[int, str]:
    with open(EA_PLAYERS_FILE, encoding="utf-8-sig", newline="") as csv_file:
        return {
            int(row["id"]): row["position"].strip().upper()
            for row in csv.DictReader(csv_file)
            if row.get("id") and row.get("position")
        }



def seed_players():

    with open(PLAYERS_FILE, encoding="utf-8") as f:
        players = json.load(f)
    ea_positions = load_ea_positions()

    inserted = 0

    with engine.begin() as conn:

        for player in players:

            conn.execute(
                text("""
                    INSERT INTO players (
                        ea_id,
                        name,
                        country,
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
                        :position,
                        :overall,
                        :club,
                        :photo_url,
                        :price
                    )
                    ON CONFLICT (ea_id) DO UPDATE
                    SET position = EXCLUDED.position
                """),
                {
                    "ea_id": player.get("ea_id"),
                    "name": player.get("name"),
                    "country": player.get("nationality"),
                    "position": ea_positions.get(
                        player.get("ea_id"),
                        player.get("position"),
                    ),
                    "overall": player.get("overall"),
                    "club": player.get("club"),
                    "photo_url": player.get("photo"),
                    "price": calculate_price(
                        player.get("overall", 70)
                    ),
                }
            )

            inserted += 1

    print(f"{inserted} jogadores processados")


if __name__ == "__main__":
    seed_players()