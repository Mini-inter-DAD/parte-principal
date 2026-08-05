POSITION_GROUPS = {
    "goalkeeper": {"GK", "GOL"},
    "defender": {
        "CB", "ZAG", "DF", "LB", "LE", "RB", "LD",
        "LWB", "AE", "ADE", "RWB", "AD", "ADD",
    },
    "midfielder": {
        "CDM", "VOL", "CM", "MC", "MF", "CAM", "MEI",
        "LM", "ME", "RM", "MD",
    },
    "attacker": {"LW", "PE", "RW", "PD", "CF", "SA", "ST", "CA", "FW"},
}

POSITION_LABELS = {
    "GK": "GOL", "GOL": "GOL", "CB": "ZAG", "ZAG": "ZAG", "DF": "ZAG",
    "LB": "LE", "LE": "LE", "RB": "LD", "LD": "LD", "LWB": "AE",
    "AE": "AE", "ADE": "AE", "RWB": "AD", "AD": "AD", "ADD": "AD",
    "CDM": "VOL", "VOL": "VOL", "CM": "MC", "MC": "MC", "MF": "MC",
    "CAM": "MEI", "MEI": "MEI", "LM": "ME", "ME": "ME", "RM": "MD",
    "MD": "MD", "LW": "PE", "PE": "PE", "RW": "PD", "PD": "PD",
    "CF": "SA", "SA": "SA", "ST": "CA", "CA": "CA", "FW": "CA",
}


def get_position_group(position: str | None) -> str | None:
    value = str(position or "").strip().upper()
    return next(
        (group for group, positions in POSITION_GROUPS.items() if value in positions),
        None,
    )


def canonical_position(position: str | None) -> str:
    value = str(position or "").strip().upper()
    return POSITION_LABELS.get(value, value)


def same_position(left: str | None, right: str | None) -> bool:
    return canonical_position(left) == canonical_position(right)


def can_play_in_position(player_position: str | None, target_position: str | None) -> bool:
    player_group = get_position_group(player_position)
    target_group = get_position_group(target_position)
    return bool(player_group and target_group and player_group == target_group)
