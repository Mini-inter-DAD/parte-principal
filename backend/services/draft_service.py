import random

from backend.repositories import draft_repository, user_repository
from backend.services.errors import BusinessRuleError, NotFoundError


OPPONENTS = (
    {"id": "japan", "name": "Japão", "code": "jp", "overall": 74},
    {"id": "usa", "name": "Estados Unidos", "code": "us", "overall": 78},
    {"id": "mexico", "name": "México", "code": "mx", "overall": 80},
    {"id": "morocco", "name": "Marrocos", "code": "ma", "overall": 82},
    {"id": "france", "name": "França", "code": "fr", "overall": 89},
)

RESULT_LABELS = {"W": "Vitória", "D": "Empate", "L": "Derrota"}


def list_opponents():
    return list(OPPONENTS)


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def calculate_team_ovr(overalls: list[int]) -> int:
    if not overalls:
        raise BusinessRuleError("O usuário ainda não possui jogadores no elenco")
    return round(sum(overalls) / len(overalls))


def simulate_match(user_ovr: int, opponent_ovr: int) -> str:
    difference = user_ovr - opponent_ovr
    win_chance = clamp(0.50 + (difference * 0.03), 0.15, 0.85)
    draw_chance = clamp(0.22 - (abs(difference) * 0.01), 0.08, 0.25)
    roll = random.random()

    if roll < win_chance:
        return "W"
    if roll < win_chance + draw_chance:
        return "D"
    return "L"


def generate_score(result: str) -> tuple[int, int]:
    if result == "W":
        user_score = random.randint(1, 4)
        return user_score, random.randint(0, user_score - 1)
    if result == "L":
        opponent_score = random.randint(1, 4)
        return random.randint(0, opponent_score - 1), opponent_score
    score = random.randint(0, 3)
    return score, score


def calculate_reward(result: str, user_ovr: int, opponent_ovr: int) -> int:
    if result != "W":
        return 0
    base_reward = 150
    opponent_bonus = opponent_ovr * 8
    difficulty_bonus = max(0, opponent_ovr - user_ovr) * 30
    return round((base_reward + opponent_bonus + difficulty_bonus) / 50) * 50


def _get_opponent(opponent_id: str | None):
    if opponent_id is None:
        return random.choice(OPPONENTS)
    opponent = next((item for item in OPPONENTS if item["id"] == opponent_id), None)
    if opponent is None:
        raise BusinessRuleError("Adversário inválido")
    return opponent


def play_draft(db, *, user_id: int, opponent_id: str | None = None):
    user = user_repository.get_user(db, user_id, for_update=True)
    if user is None:
        raise NotFoundError("User not found")

    overalls = draft_repository.list_user_overalls(db, user_id)
    user_ovr = calculate_team_ovr(overalls)
    opponent = _get_opponent(opponent_id)
    result = simulate_match(user_ovr, opponent["overall"])
    user_score, opponent_score = generate_score(result)
    coins_earned = calculate_reward(result, user_ovr, opponent["overall"])

    match = draft_repository.create_match(
        db,
        user_id=user_id,
        user_ovr=user_ovr,
        opponent_name=opponent["name"],
        opponent_ovr=opponent["overall"],
        user_score=user_score,
        opponent_score=opponent_score,
        result=result,
        coins_earned=coins_earned,
    )
    new_balance = user["coins"]
    if coins_earned:
        updated_user = user_repository.update_coins(
            db,
            user_id,
            user["coins"] + coins_earned,
        )
        new_balance = updated_user["coins"]

    db.commit()
    return {
        "match_id": match["id"],
        "user_id": user_id,
        "team_name": user["username"],
        "user_ovr": user_ovr,
        "opponent": opponent,
        "score": {"user": user_score, "opponent": opponent_score},
        "result": result,
        "result_label": RESULT_LABELS[result],
        "coins_earned": coins_earned,
        "new_balance": new_balance,
        "played_at": match["played_at"],
    }


def get_history(db, user_id: int):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")
    return [
        {
            **dict(row),
            "result_label": RESULT_LABELS[row["result"]],
        }
        for row in draft_repository.list_history(db, user_id)
    ]
