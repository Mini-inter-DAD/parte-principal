FORMATION_SLOTS = {
    "GK": {"GK"},
    "LB": {"LB", "LWB"},
    "CB1": {"CB"},
    "CB2": {"CB"},
    "CB3": {"CB"},
    "RB": {"RB", "RWB"},
    "LWB": {"LWB", "LM", "LB"},
    "RWB": {"RWB", "RM", "RB"},
    "CDM": {"CDM"},
    "CDM1": {"CDM", "CM"},
    "CDM2": {"CDM", "CM"},
    "CM1": {"CM", "CDM", "CAM"},
    "CM2": {"CM", "CDM", "CAM"},
    "CM3": {"CM", "CDM", "CAM"},
    "CAM": {"CAM", "CM"},
    "LM": {"LM", "LW", "CM"},
    "RM": {"RM", "RW", "CM"},
    "LW": {"LW", "LM"},
    "RW": {"RW", "RM"},
    "ST": {"ST", "CF"},
    "ST1": {"ST", "CF"},
    "ST2": {"ST", "CF"},
}


def normalize_position(value: str | None) -> str:
    return str(value or "").strip().upper()


def get_allowed_positions(slot: str | None) -> set[str] | None:
    return FORMATION_SLOTS.get(normalize_position(slot))


def get_slot_base_position(slot: str | None) -> str | None:
    normalized_slot = normalize_position(slot)
    allowed_positions = get_allowed_positions(normalized_slot)
    if not allowed_positions:
        return None
    if normalized_slot.startswith("CB"):
        return "CB"
    if normalized_slot.startswith("CM"):
        return "CM"
    if normalized_slot.startswith("CDM"):
        return "CDM"
    if normalized_slot.startswith("ST"):
        return "ST"
    return normalized_slot


def same_slot(left: str | None, right: str | None) -> bool:
    return normalize_position(left) == normalize_position(right)


def can_play_in_slot(player_position: str | None, target_slot: str | None) -> bool:
    allowed_positions = get_allowed_positions(target_slot)
    return bool(
        allowed_positions
        and normalize_position(player_position) in allowed_positions
    )
