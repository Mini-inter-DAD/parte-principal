def calculate_player_price(overall: int) -> int:
    if overall >= 90:
        return 15000
    if overall >= 86:
        return 10000
    if overall >= 82:
        return 7000
    if overall >= 78:
        return 4500
    if overall >= 74:
        return 2500
    if overall >= 70:
        return 1200
    return 500
