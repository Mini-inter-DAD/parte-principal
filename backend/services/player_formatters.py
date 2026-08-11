import csv
from functools import lru_cache
from pathlib import Path


EA_PLAYERS_FILE = Path(__file__).resolve().parents[2] / "data" / "ea_fc26_players.csv"


NATIONALITY_TRANSLATIONS = {
    "brazil": "Brasil",
    "argentina": "Argentina",
    "france": "França",
    "germany": "Alemanha",
    "belgium": "Bélgica",
    "england": "Inglaterra",
    "spain": "Espanha",
    "portugal": "Portugal",
    "netherlands": "Holanda",
    "holland": "Holanda",
    "united states": "Estados Unidos",
    "south korea": "Coreia do Sul",
    "japan": "Japão",
    "norway": "Noruega",
    "sweden": "Suécia",
    "switzerland": "Suíça",
    "turkey": "Turquia",
    "morocco": "Marrocos",
    "uruguay": "Uruguai",
    "ecuador": "Equador",
    "egypt": "Egito",
}

NATIONALITY_CODES = {
    "brazil": "BR",
    "brasil": "BR",
    "argentina": "AR",
    "france": "FR",
    "fran\u00e7a": "FR",
    "germany": "DE",
    "alemanha": "DE",
    "belgium": "BE",
    "b\u00e9lgica": "BE",
    "england": "GB",
    "inglaterra": "GB",
    "spain": "ES",
    "espanha": "ES",
    "portugal": "PT",
    "netherlands": "NL",
    "holland": "NL",
    "holanda": "NL",
    "united states": "US",
    "estados unidos": "US",
    "south korea": "KR",
    "coreia do sul": "KR",
    "japan": "JP",
    "jap\u00e3o": "JP",
    "croatia": "HR",
    "cro\u00e1cia": "HR",
    "norway": "NO",
    "noruega": "NO",
    "sweden": "SE",
    "su\u00e9cia": "SE",
    "switzerland": "CH",
    "su\u00ed\u00e7a": "CH",
    "turkey": "TR",
    "turquia": "TR",
    "morocco": "MA",
    "marrocos": "MA",
    "uruguay": "UY",
    "uruguai": "UY",
    "ecuador": "EC",
    "equador": "EC",
    "egypt": "EG",
    "egito": "EG",
}


def normalize_o_slash(name: str) -> str:
    return str(name).replace("Ø", "O").replace("ø", "o")


@lru_cache(maxsize=1)
def _source_names_with_o_slash() -> dict[int, str]:
    if not EA_PLAYERS_FILE.exists():
        return {}

    with EA_PLAYERS_FILE.open(encoding="utf-8-sig", newline="") as csv_file:
        source_names = {}
        for row in csv.DictReader(csv_file):
            source_name = f"{row.get('firstName', '')} {row.get('lastName', '')}".strip()
            if row.get("id") and ("Ø" in source_name or "ø" in source_name):
                source_names[int(row["id"])] = source_name
        return source_names


def _recover_legacy_name(name: str, ea_id: int | None) -> str:
    if "?" not in name or ea_id is None:
        return name
    return _source_names_with_o_slash().get(int(ea_id), name)


def format_player_name(name: str, *, ea_id: int | None = None) -> str:
    normalized = " ".join(str(name).strip().split())
    normalized = _recover_legacy_name(normalized, ea_id)
    return normalize_o_slash(normalized).title()


def translate_nationality(nationality: str) -> str:
    value = str(nationality).strip()
    return NATIONALITY_TRANSLATIONS.get(value.casefold(), value)


def source_nationality(nationality: str) -> str:
    value = str(nationality).strip()
    normalized = value.casefold()
    source_aliases = {
        translated.casefold(): source.title()
        for source, translated in NATIONALITY_TRANSLATIONS.items()
    }
    source_aliases.update({
        "brasil": "Brazil",
        "fran\u00e7a": "France",
        "alemanha": "Germany",
        "b\u00e9lgica": "Belgium",
        "inglaterra": "England",
        "espanha": "Spain",
        "holanda": "Netherlands",
        "estados unidos": "United States",
        "coreia do sul": "South Korea",
        "jap\u00e3o": "Japan",
    })
    if normalized in source_aliases:
        return source_aliases[normalized]
    for source, translated in NATIONALITY_TRANSLATIONS.items():
        if normalized == translated.casefold():
            return source.title() if source != "united states" else "United States"
    return value


def country_code(nationality: str) -> str | None:
    value = str(nationality or "").strip()
    if len(value) == 2 and value.isascii() and value.isalpha():
        return value.upper()
    return NATIONALITY_CODES.get(value.casefold())
