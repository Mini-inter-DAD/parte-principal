# build_squads.py
import json
import requests
import unicodedata
import re
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from pipeline.cache import get_cache, set_cache, file_hash, text_hash
from pipeline.source.fifa_source import get_players
from pipeline.source.photo_source import FootballApiService

SQUADS_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.squads.json"

EA_CSV = Path("data/ea_fc26_players.csv")
MATCH_VERSION = "1"

def normalize(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r'[^\w\s]', '', name)
    return ''.join(
        c for c in unicodedata.normalize('NFD', name)
        if unicodedata.category(c) != 'Mn'
    )

def name_variants(name: str) -> set[str]:
    n = normalize(name)
    parts = n.split()
    variants = {n}
    if len(parts) > 2:
        variants.add(f"{parts[0]} {parts[-1]}")   
        variants.add(f"{parts[0]} {parts[1]}")    
    return variants


POSITION_GROUPS = {
    "GK": {"GK"},
    "DF": {"DF", "CB", "LB", "RB", "LWB", "RWB"},
    "MF": {"MF", "CDM", "CM", "CAM", "LM", "RM"},
    "FW": {"FW", "LW", "RW", "CF", "ST"},
}


def position_group(position: str | None) -> str | None:
    normalized = str(position or "").strip().upper()
    return next(
        (group for group, positions in POSITION_GROUPS.items() if normalized in positions),
        None,
    )


def build_ea_index(ea_players) -> dict[str, list[object]]:
    index: dict[str, list[object]] = {}
    for player in ea_players:
        variants = name_variants(player.raw_name)
        if player.common_name:
            variants.update(name_variants(player.common_name))
        for variant in variants:
            index.setdefault(variant, []).append(player)
    return index


def find_player_match(wc_name: str, nation: str, wc_position: str, ea_index):
    normalized_wc_name = normalize(wc_name)
    candidates = {
        player.ea_id: player
        for variant in name_variants(wc_name)
        for player in ea_index.get(variant, [])
    }
    if not candidates:
        return None

    wc_group = position_group(wc_position)
    ranked = []
    for player in candidates.values():
        score = 0
        if normalize(player.nationality) == normalize(nation):
            score += 100
        if wc_group and position_group(player.position) == wc_group:
            score += 80
        if normalize(player.raw_name) == normalized_wc_name:
            score += 60
        if player.common_name and normalize(player.common_name) == normalized_wc_name:
            score += 50
        ranked.append((score, player))

    ranked.sort(key=lambda item: (-item[0], item[1].ea_id))
    if len(ranked) > 1 and ranked[0][0] == ranked[1][0]:
        return None
    return ranked[0][1]

def main():
    print("Baixando elencos do openfootball...")
    squads = requests.get(SQUADS_URL).json()
    print(f"{len(squads)} seleções carregadas")

    fingerprint = text_hash(
        json.dumps(squads, ensure_ascii=False, sort_keys=True)
        + file_hash(EA_CSV)
        + MATCH_VERSION
    )

    result = get_cache("build_squads", fingerprint)
    if result is not None:
        print(f"✅ {len(result)} jogadores recuperados do cache")
        output_dir = Path(__file__).parent.parent / "output"
        output_file = output_dir / "players.json"
        output_file.write_text(
            json.dumps(result, ensure_ascii=True, indent=4),
            encoding="utf-8",
        )
        return

    print("Carregando CSV EA FC...")
    ea_players = get_players()

    # Índice com todos os candidatos; nomes comuns podem pertencer a mais de um jogador.
    ea_index = build_ea_index(ea_players)

    api = FootballApiService()
    result = []
    missing = []

    for team in squads:
        nation = team["name"]
        for player in team["players"]:
            wc_name = player["name"]
            found = find_player_match(wc_name, nation, player["pos"], ea_index)

            if found:
                result.append({
                    "nation": nation,
                    "wc_name": wc_name,
                    "ea_id": found.ea_id,
                    "name": found.raw_name,
                    "common_name": found.common_name,
                    "overall": found.overall,
                    "position": player["pos"],
                    "nationality": found.nationality,
                    "club": found.club,
                    "photo": None,
                })
            else:
                missing.append({"nation": nation, "name": wc_name})

    print(f"\n✅ Encontrados: {len(result)}")
    print(f"⚠️  Ausentes no EA: {len(missing)}")
    for m in missing:
        print(f"  [{m['nation']}] {m['name']}")

    # busca fotos em paralelo
    print("\nBuscando fotos...")
    def fetch_photo(entry):
        entry["photo"] = api.get_photo(entry["ea_id"])
        return entry

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(fetch_photo, e): e for e in result}
        done = 0
        for future in as_completed(futures):
            future.result()
            done += 1
            if done % 50 == 0:
                print(f"  {done}/{len(result)} fotos...")

    set_cache("build_squads", fingerprint, result)

    output_dir = Path(__file__).parent.parent / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "players.json"
    output_file.write_text(
        json.dumps(result, ensure_ascii=True, indent=4),
        encoding="utf-8",
    )

    print("Feito!")

if __name__ == "__main__":
    main()
