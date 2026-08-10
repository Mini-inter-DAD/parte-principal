# build_squads.py
import json
import requests
import unicodedata
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pipeline.source.fifa_source import get_players
from pipeline.source.photo_source import FootballApiService

SQUADS_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.squads.json"

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

def main():
    print("Baixando elencos do openfootball...")
    squads = requests.get(SQUADS_URL).json()
    print(f"{len(squads)} seleções carregadas")

    print("Carregando CSV EA FC...")
    ea_players = get_players()

    # índice: nome normalizado -> player
    ea_index: dict[str, object] = {}
    for p in ea_players:
        for v in name_variants(p.raw_name):
            ea_index[v] = p
        if p.common_name:
            for v in name_variants(p.common_name):
                ea_index[v] = p

    api = FootballApiService()
    result = []
    missing = []

    for team in squads:
        nation = team["name"]
        for player in team["players"]:
            wc_name = player["name"]
            found = None
            for v in name_variants(wc_name):
                if v in ea_index:
                    found = ea_index[v]
                    break

            if found:
                result.append({
                    "nation": nation,
                    "wc_name": wc_name,
                    "ea_id": found.ea_id,
                    "name": found.name,
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

    with open("output/players.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)

    print("Feito!")

if __name__ == "__main__":
    main()