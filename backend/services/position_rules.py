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

SLOT_BASE_POSITIONS = {
    "GK": "GK",
    "LB": "LB",
    "CB1": "CB", "CB2": "CB", "CB3": "CB",
    "RB": "RB",
    "LWB": "LWB", "RWB": "RWB",
    "CDM": "CDM", "CDM1": "CDM", "CDM2": "CDM",
    "CM1": "CM", "CM2": "CM", "CM3": "CM",
    "CAM": "CAM", "LM": "LM", "RM": "RM",
    "LW": "LW", "RW": "RW",
    "ST": "ST", "ST1": "ST", "ST2": "ST",
}


def get_slot_base_position(slot: str | None) -> str | None:
    return SLOT_BASE_POSITIONS.get(str(slot or "").strip().upper())


def get_position_group(position: str | None) -> str | None:
    value = str(position or "").strip().upper()
    value = SLOT_BASE_POSITIONS.get(value, value)
    return next(
        (group for group, positions in POSITION_GROUPS.items() if value in positions),
        None,
    )


def canonical_position(position: str | None) -> str:
    value = str(position or "").strip().upper()
    return POSITION_LABELS.get(value, value)


def same_position(left: str | None, right: str | None) -> bool:
    return canonical_position(left) == canonical_position(right)


def same_slot(left: str | None, right: str | None) -> bool:
    return str(left or "").strip().upper() == str(right or "").strip().upper()


def can_play_in_position(player_position: str | None, target_position: str | None) -> bool:
    player_group = get_position_group(player_position)
    target_group = get_position_group(target_position)
    return bool(player_group and target_group and player_group == target_group)


def can_play_in_slot(player_position: str | None, target_slot: str | None) -> bool:
    target_base_position = get_slot_base_position(target_slot)
    return bool(
        target_base_position
        and can_play_in_position(player_position, target_base_position)
    )
