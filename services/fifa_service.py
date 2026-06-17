import pandas as pd
from models.player import Player
from utils.utils import normalizar_nome_acento

def get_players():
    df = pd.read_csv("data/ea_fc26_players.csv")

    players = []

    for _, row in df.iterrows():

        nome_raw = f"{row['firstName']} {row['lastName']}".strip()
        nome = normalizar_nome_acento(nome_raw)

        common_name_raw = row.get("commonName", None)
        common_name = (
            str(common_name_raw)
            if common_name_raw and str(common_name_raw).lower() != "nan"
            else None
        )

        common_name_raw = row.get("commonName", None)
        common_name = (
            normalizar_nome_acento(str(common_name_raw))
            if common_name_raw and str(common_name_raw).lower() != "nan"
            else None
        )

        player = Player(
            ea_id=row["id"],
            raw_name=nome_raw,
            name=nome,
            common_name=common_name,
            overall=row["overallRating"],
            position=row["position"],
            nationality=row["nationality"],
            club=row["team"]
        )

        players.append(player)

    return players