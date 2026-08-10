import random

from backend.repositories import draft_repository, user_repository
from backend.services.errors import BusinessRuleError, NotFoundError
from backend.services.player_formatters import format_player_name


CUP_PHASES = (
    "Fase de Grupos - Jogo 1/3",
    "Fase de Grupos - Jogo 2/3",
    "Fase de Grupos - Jogo 3/3",
    "16 avos",
    "Oitavas de Final",
    "Quartas de Final",
    "Semifinal",
    "Final",
)


OPPONENTS = (
    {
        "id": "japan",
        "name": "Japão",
        "code": "jp",
        "overall": 74,
        "scorers": (
            {"playerId": "japan-1", "playerName": "Kubo", "position": "RW"},
            {"playerId": "japan-2", "playerName": "Ueda", "position": "ST"},
        ),
    },
    {
        "id": "usa",
        "name": "Estados Unidos",
        "code": "us",
        "overall": 78,
        "scorers": (
            {"playerId": "usa-1", "playerName": "Pulisic", "position": "LW"},
            {"playerId": "usa-2", "playerName": "Balogun", "position": "ST"},
        ),
    },
    {
        "id": "mexico",
        "name": "México",
        "code": "mx",
        "overall": 80,
        "scorers": (
            {"playerId": "mexico-1", "playerName": "Lozano", "position": "LW"},
            {"playerId": "mexico-2", "playerName": "Gimenez", "position": "ST"},
        ),
    },
    {
        "id": "morocco",
        "name": "Marrocos",
        "code": "ma",
        "overall": 82,
        "scorers": (
            {"playerId": "morocco-1", "playerName": "Hakimi", "position": "RB"},
            {"playerId": "morocco-2", "playerName": "En-Nesyri", "position": "ST"},
        ),
    },
    {
        "id": "france",
        "name": "França",
        "code": "fr",
        "overall": 89,
        "scorers": (
            {"playerId": "france-1", "playerName": "Mbappe", "position": "ST"},
            {"playerId": "france-2", "playerName": "Griezmann", "position": "CAM"},
        ),
    },
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


def _campaign_payload(campaign):
    phase_index = int(campaign["phase_index"])
    return {
        "phase_index": phase_index,
        "phase": CUP_PHASES[phase_index],
        "status": campaign["status"],
        "group_matches": int(campaign["group_matches"]),
        "group_points": int(campaign["group_points"]),
        "group_losses": int(campaign["group_losses"]),
        "can_play": campaign["status"] == "ACTIVE",
    }


def _default_campaign(user_id: int):
    return {
        "user_id": user_id,
        "phase_index": 0,
        "phase": CUP_PHASES[0],
        "status": "ACTIVE",
        "group_matches": 0,
        "group_points": 0,
        "group_losses": 0,
        "can_play": True,
    }


def _serialize_goal_events(events):
    return [
        {
            "playerId": str(event["player_id"]),
            "playerName": event["player_name"],
            "minute": int(event["minute"]),
            "position": event["position"],
            "team": event["team"],
        }
        for event in events
    ]


def _generate_goal_events(user_score: int, opponent_score: int, starters, opponent):
    total_goals = user_score + opponent_score
    if total_goals == 0:
        return []

    minutes = sorted(random.sample(range(1, 91), total_goals))
    user_players = list(starters)
    opponent_players = list(opponent["scorers"])
    events = []

    for index in range(user_score):
        scorer = random.choice(user_players)
        events.append(
            {
                "player_id": str(scorer["id"]),
                "player_name": format_player_name(scorer["name"]),
                "minute": minutes[len(events)],
                "position": scorer["position"],
                "team": "USER",
            }
        )

    for index in range(opponent_score):
        scorer = random.choice(opponent_players)
        events.append(
            {
                "player_id": scorer["playerId"],
                "player_name": scorer["playerName"],
                "minute": minutes[len(events)],
                "position": scorer["position"],
                "team": "OPPONENT",
            }
        )

    return sorted(events, key=lambda event: event["minute"])


def _advance_campaign(campaign, result: str):
    phase_index = int(campaign["phase_index"])
    group_matches = int(campaign["group_matches"])
    group_points = int(campaign["group_points"])
    group_losses = int(campaign["group_losses"])
    status = campaign["status"]

    if phase_index < 3:
        group_matches += 1
        group_points += {"W": 3, "D": 1, "L": 0}[result]
        group_losses += int(result == "L")
        if group_losses >= 2:
            status = "ELIMINATED"
        elif group_matches >= 3:
            phase_index = 3
        else:
            phase_index = group_matches
    elif result == "W":
        if phase_index == len(CUP_PHASES) - 1:
            status = "COMPLETED"
        else:
            phase_index += 1
    elif result == "L":
        status = "ELIMINATED"

    return phase_index, group_matches, group_points, group_losses, status


def play_draft(db, *, user_id: int, opponent_id: str | None = None, mode: str = "cup"):
    try:
        user = user_repository.get_user(db, user_id, for_update=True)
        if user is None:
            raise NotFoundError("User not found")

        starter_count = draft_repository.count_valid_starters(db, user_id)
        if starter_count != 11:
            raise BusinessRuleError(
                f"É necessário ter exatamente 11 titulares válidos para jogar. Atual: {starter_count}."
            )

        starters = draft_repository.list_user_starters(db, user_id)
        user_ovr = calculate_team_ovr([int(row["overall"]) for row in starters])
        opponent = _get_opponent(opponent_id)
        campaign = None
        phase_index = None

        if mode == "cup":
            campaign = draft_repository.get_or_create_campaign(db, user_id)
            if campaign["status"] != "ACTIVE":
                raise BusinessRuleError("A campanha da Copa não está disponível para novas partidas")
            phase_index = int(campaign["phase_index"])

        result = simulate_match(user_ovr, opponent["overall"])
        user_score, opponent_score = generate_score(result)
        coins_earned = calculate_reward(result, user_ovr, opponent["overall"])
        goal_events = _generate_goal_events(user_score, opponent_score, starters, opponent)

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
            mode=mode,
            phase_index=phase_index,
        )
        draft_repository.create_goal_events(db, match["id"], goal_events)

        campaign_payload = None
        if campaign is not None:
            next_phase, group_matches, group_points, group_losses, status = _advance_campaign(
                campaign,
                result,
            )
            campaign = draft_repository.update_campaign(
                db,
                campaign["id"],
                phase_index=next_phase,
                group_matches=group_matches,
                group_points=group_points,
                group_losses=group_losses,
                status=status,
            )
            campaign_payload = _campaign_payload(campaign)

        new_balance = int(user["coins"])
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
            "mode": mode,
            "phase_index": phase_index,
            "goal_events": _serialize_goal_events(goal_events),
            "campaign": campaign_payload,
        }
    except Exception:
        db.rollback()
        raise


def get_history(db, user_id: int):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")

    history = []
    for row in draft_repository.list_history(db, user_id):
        history.append(
            {
                **dict(row),
                "result_label": RESULT_LABELS[row["result"]],
                "goal_events": _serialize_goal_events(
                    draft_repository.list_goal_events(db, row["id"])
                ),
            }
        )
    return history


def get_campaign_state(db, user_id: int):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")
    campaign = draft_repository.get_campaign(db, user_id)
    if campaign is None:
        return _default_campaign(user_id)
    return {"user_id": user_id, **_campaign_payload(campaign)}


def restart_campaign(db, user_id: int):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")

    try:
        campaign = draft_repository.get_or_create_campaign(db, user_id)
        if campaign["status"] == "ACTIVE":
            raise BusinessRuleError("A campanha da Copa ainda está ativa")
        campaign = draft_repository.update_campaign(
            db,
            campaign["id"],
            phase_index=0,
            group_matches=0,
            group_points=0,
            group_losses=0,
            status="ACTIVE",
        )
        db.commit()
        return {"user_id": user_id, **_campaign_payload(campaign)}
    except Exception:
        db.rollback()
        raise
