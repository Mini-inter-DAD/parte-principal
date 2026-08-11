import random
import unicodedata

from backend.repositories import draft_repository, squad_repository, user_repository
from backend.services.errors import (
    BusinessRuleError,
    InvalidOpponentError,
    InvalidStageError,
    NotFoundError,
)
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


WORLD_CUP_STAGES = {
    "group_stage": {
        "label": "Fase de Grupos",
        "min_ovr": 70,
        "max_ovr": 78,
    },
    "round_of_16": {
        "label": "Oitavas de Final",
        "min_ovr": 76,
        "max_ovr": 82,
    },
    "quarter_final": {
        "label": "Quartas de Final",
        "min_ovr": 80,
        "max_ovr": 85,
    },
    "semi_final": {
        "label": "Semifinal",
        "min_ovr": 84,
        "max_ovr": 88,
    },
    "final": {
        "label": "Final",
        "min_ovr": 87,
        "max_ovr": 92,
    },
}


PHASE_STAGE_KEYS = (
    "group_stage",
    "group_stage",
    "group_stage",
    "round_of_16",
    "round_of_16",
    "quarter_final",
    "semi_final",
    "final",
)


GOAL_SCORER_WEIGHTS = {
    "ST": 10,
    "CF": 9,
    "LW": 8,
    "RW": 8,
    "CAM": 6,
    "LM": 5,
    "RM": 5,
    "CM": 4,
    "CDM": 2,
    "LB": 1,
    "RB": 1,
    "LWB": 1,
    "RWB": 1,
    "CB": 1,
    "GK": 0.05,
}


PENALTY_ZONES = (
    "top_left",
    "top_center",
    "top_right",
    "bottom_left",
    "bottom_right",
)


RESULT_LABELS = {"W": "Vitória", "D": "Empate", "L": "Derrota"}


NATIONAL_TEAM_ROSTER_SIZE = 26

NATIONAL_TEAM_CODES = {
    "algeria": "dz",
    "argentina": "ar",
    "australia": "au",
    "austria": "at",
    "belgium": "be",
    "bosnia and herzegovina": "ba",
    "brazil": "br",
    "canada": "ca",
    "cape verde": "cv",
    "colombia": "co",
    "croatia": "hr",
    "czech republic": "cz",
    "dr congo": "cd",
    "ecuador": "ec",
    "egypt": "eg",
    "england": "gb-eng",
    "france": "fr",
    "germany": "de",
    "ghana": "gh",
    "haiti": "ht",
    "iran": "ir",
    "iraq": "iq",
    "ivory coast": "ci",
    "japan": "jp",
    "jordan": "jo",
    "mexico": "mx",
    "morocco": "ma",
    "netherlands": "nl",
    "new zealand": "nz",
    "norway": "no",
    "panama": "pa",
    "paraguay": "py",
    "portugal": "pt",
    "qatar": "qa",
    "saudi arabia": "sa",
    "scotland": "gb-sct",
    "senegal": "sn",
    "south africa": "za",
    "south korea": "kr",
    "spain": "es",
    "sweden": "se",
    "switzerland": "ch",
    "tunisia": "tn",
    "turkey": "tr",
    "united states": "us",
    "uruguay": "uy",
    "uzbekistan": "uz",
    "curacao": "cw",
    "curaaao": "cw",
}


def _team_key(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", str(name).strip())
    return " ".join(normalized.encode("ascii", "ignore").decode().casefold().split())


def _team_id(name: str) -> str:
    return _team_key(name).replace(" ", "-")


def _serialize_team_player(player) -> dict:
    return {
        "id": int(player["id"]),
        "name": format_player_name(player["name"]),
        "position": player["position"],
        "overall": int(player["overall"]),
        "club": player["club"],
        "photo_url": player["photo_url"],
    }


def _build_opponent(team_name: str, roster: list[dict]) -> dict | None:
    if len(roster) < NATIONAL_TEAM_ROSTER_SIZE:
        return None

    roster = roster[:NATIONAL_TEAM_ROSTER_SIZE]
    players = [_serialize_team_player(player) for player in roster]
    scorers = [
        {
            "playerId": str(player["id"]),
            "playerName": format_player_name(player["name"]),
            "position": player["position"],
        }
        for player in roster
    ]

    return {
        "id": _team_id(team_name),
        "name": team_name,
        "code": NATIONAL_TEAM_CODES.get(_team_key(team_name), "un"),
        "overall": calculate_team_ovr([int(player["overall"]) for player in roster]),
        "players": players,
        "scorers": scorers,
    }


def list_opponents(db):
    teams = {}
    for player in draft_repository.list_national_team_players(db):
        team_name = str(player["national_team"]).strip()
        teams.setdefault(team_name, []).append(player)

    opponents = []
    for team_name in sorted(teams, key=_team_key):
        opponent = _build_opponent(team_name, teams[team_name])
        if opponent is not None:
            opponents.append(opponent)

    if not opponents:
        raise BusinessRuleError(
            "Nenhuma selecao com 26 jogadores foi encontrada na base de dados"
        )
    return opponents


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def calculate_team_ovr(overalls: list[int]) -> int:
    if not overalls:
        raise BusinessRuleError("O usuário ainda não possui jogadores no elenco")
    return round(sum(overalls) / len(overalls))


def simulate_match(user_ovr: int, opponent_ovr: int) -> str:
    # Probabilidades derivadas da diferença de overall:
    # favoritismo ajusta a chance de vitória, e o empate cai quanto maior a diferença.
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


def normalize_stage(stage: str | None) -> str | None:
    if stage is None:
        return None

    normalized = str(stage).strip().lower()
    if normalized not in WORLD_CUP_STAGES:
        raise InvalidStageError("Fase da Copa inválida")
    return normalized


def stage_for_phase(phase_index: int) -> str:
    safe_index = max(0, min(int(phase_index), len(PHASE_STAGE_KEYS) - 1))
    return PHASE_STAGE_KEYS[safe_index]


def _select_opponent(opponents: list[dict], stage: str) -> dict:
    config = WORLD_CUP_STAGES[stage]
    candidates = [
        opponent
        for opponent in opponents
        if config["min_ovr"] <= int(opponent["overall"]) <= config["max_ovr"]
    ]

    if not candidates:
        # Algumas bases podem não ter seleções dentro da faixa ideal.
        # Nesse caso, usa a seleção disponível mais próxima da dificuldade.
        target = (config["min_ovr"] + config["max_ovr"]) / 2
        closest_distance = min(
            abs(int(opponent["overall"]) - target)
            for opponent in opponents
        )
        candidates = [
            opponent
            for opponent in opponents
            if abs(int(opponent["overall"]) - target) == closest_distance
        ]

    return random.choice(candidates)


def _find_opponent(opponents: list[dict], opponent_id: str) -> dict:
    requested_id = str(opponent_id).strip()
    opponent = next(
        (item for item in opponents if str(item.get("id")) == requested_id),
        None,
    )
    if opponent is None:
        raise InvalidOpponentError("Adversário inválido")
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
            "type": "goal",
        }
        for event in events
    ]


def _choose_goal_scorer(players):
    if not players:
        return None

    weights = [
        GOAL_SCORER_WEIGHTS.get(
            str(player.get("position") or "").strip().upper(),
            1,
        )
        for player in players
    ]
    return random.choices(players, weights=weights, k=1)[0]


def _player_identity(player):
    if not player:
        return None, None, None

    return (
        player.get("id") or player.get("playerId"),
        player.get("name") or player.get("playerName"),
        player.get("position"),
    )


def _generate_goal_events(
    user_score: int,
    opponent_score: int,
    starters,
    opponent,
    *,
    fallback_user_players=None,
    user_team_name: str = "Seu elenco",
):
    total_goals = user_score + opponent_score
    if total_goals == 0:
        return []

    minutes = sorted(random.sample(range(1, 91), total_goals))
    user_players = list(starters or fallback_user_players or [])
    opponent_players = list(opponent.get("scorers") or opponent.get("players") or [])
    opponent_name = str(opponent.get("name") or "seleção adversária")
    events = []

    for index in range(user_score):
        scorer = _choose_goal_scorer(user_players)
        player_id, player_name, position = _player_identity(scorer)
        events.append(
            {
                "player_id": str(player_id) if player_id is not None else "user-team",
                "player_name": format_player_name(player_name) if player_name else f"Jogador do {user_team_name}",
                "minute": minutes[len(events)],
                "position": position,
                "team": "USER",
            }
        )

    for index in range(opponent_score):
        scorer = _choose_goal_scorer(opponent_players)
        player_id, player_name, position = _player_identity(scorer)
        events.append(
            {
                "player_id": str(player_id) if player_id is not None else "opponent-team",
                "player_name": format_player_name(player_name) if player_name else f"Atacante da {opponent_name}",
                "minute": minutes[len(events)],
                "position": position,
                "team": "OPPONENT",
            }
        )

    return sorted(events, key=lambda event: event["minute"])


def goalkeeper_decision_time(goalkeeper_overall: int) -> int:
    normalized = clamp((int(goalkeeper_overall) - 60) / 35, 0, 1)
    return round(3 + normalized * 5)


def available_penalty_zones(opponent_goalkeeper_overall: int) -> list[str]:
    zones_to_remove = 0
    if int(opponent_goalkeeper_overall) >= 90:
        zones_to_remove = 2
    elif int(opponent_goalkeeper_overall) >= 85:
        zones_to_remove = 1

    removed = set(random.sample(PENALTY_ZONES, zones_to_remove))
    return [zone for zone in PENALTY_ZONES if zone not in removed]


def _select_goalkeeper(players, *, user_team: bool) -> dict:
    players = list(players or [])
    candidates = [
        player
        for player in players
        if str(player.get("position") or "").strip().upper() == "GK"
        or (
            user_team
            and str(player.get("squad_position") or "").strip().upper() == "GK"
        )
    ]
    pool = candidates or players
    if not pool:
        return {"name": "Goleiro", "overall": 60}
    return max(pool, key=lambda player: int(player.get("overall") or 0))


def _penalty_shooter_name(players, fallback: str) -> str:
    scorer = _choose_goal_scorer(list(players or []))
    if scorer is None:
        return fallback
    return format_player_name(scorer.get("name") or scorer.get("playerName") or fallback)


def _find_opponent_by_name(opponents: list[dict], name: str) -> dict:
    opponent = next(
        (item for item in opponents if _team_key(item.get("name")) == _team_key(name)),
        None,
    )
    if opponent is None:
        raise InvalidOpponentError("Adversário da partida não está mais disponível")
    return opponent


def _penalty_winner(
    user_score: int,
    opponent_score: int,
    user_attempts: int,
    opponent_attempts: int,
) -> str | None:
    user_remaining = max(0, 5 - user_attempts)
    opponent_remaining = max(0, 5 - opponent_attempts)

    if user_attempts < 5 or opponent_attempts < 5:
        if user_score > opponent_score + opponent_remaining:
            return "USER"
        if opponent_score > user_score + user_remaining:
            return "OPPONENT"

    if (
        user_attempts >= 5
        and opponent_attempts >= 5
        and user_attempts == opponent_attempts
        and user_score != opponent_score
    ):
        return "USER" if user_score > opponent_score else "OPPONENT"
    return None


def _penalty_scored(shoot_zone: str, keeper_dive_zone: str) -> bool:
    if shoot_zone == keeper_dive_zone:
        return False
    return random.random() < 0.9


def _penalty_state_payload(shootout) -> dict:
    current_turn = shootout["current_turn"]
    available_zones = (
        list(shootout["available_shoot_zones"] or [])
        if current_turn == "user_shoot"
        else list(PENALTY_ZONES)
    )
    goalkeeper_name = (
        shootout["opponent_goalkeeper_name"]
        if current_turn == "user_shoot"
        else shootout["user_goalkeeper_name"]
    )
    return {
        "shootout_id": int(shootout.get("shootout_id") or shootout.get("id")),
        "match_id": int(shootout["match_id"]),
        "current_turn": current_turn,
        "shooter_name": shootout["current_shooter_name"],
        "goalkeeper_name": goalkeeper_name,
        "user_penalties": int(shootout["user_score"]),
        "opponent_penalties": int(shootout["opponent_score"]),
        "user_attempts": int(shootout["user_attempts"]),
        "opponent_attempts": int(shootout["opponent_attempts"]),
        "available_zones": available_zones,
        "decision_time_seconds": goalkeeper_decision_time(
            int(shootout["user_goalkeeper_overall"])
        ),
        "is_finished": bool(shootout["is_finished"]),
        "winner": shootout["winner"],
    }


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


def play_draft(
    db,
    *,
    user_id: int,
    requested_opponent_id: str | None = None,
    requested_stage: str | None = None,
    mode: str = "cup",
):
    try:
        requested_stage = normalize_stage(requested_stage)
        user = user_repository.get_user(db, user_id, for_update=True)
        if user is None:
            raise NotFoundError("User not found")

        if draft_repository.get_active_penalty_shootout(db, user_id) is not None:
            raise BusinessRuleError("Conclua a disputa de pênaltis antes de iniciar outra partida")

        starter_count = draft_repository.count_valid_starters(db, user_id)
        if starter_count != 11:
            raise BusinessRuleError(
                f"É necessário ter exatamente 11 titulares válidos para jogar. Atual: {starter_count}."
            )

        starters = draft_repository.list_user_starters(db, user_id)
        user_ovr = calculate_team_ovr([int(row["overall"]) for row in starters])
        fallback_user_players = (
            starters
            if starters
            else squad_repository.list_user_players(db, user_id)
        )
        campaign = None
        phase_index = None

        if mode == "cup":
            campaign = draft_repository.get_or_create_campaign(db, user_id)
            if campaign["status"] != "ACTIVE":
                raise BusinessRuleError("A campanha da Copa não está disponível para novas partidas")
            phase_index = int(campaign["phase_index"])
            stage = stage_for_phase(phase_index)
            if requested_stage is not None and requested_stage != stage:
                raise InvalidStageError("A fase enviada não corresponde à fase atual da Copa")
        else:
            stage = requested_stage or "group_stage"
            if stage != "group_stage":
                raise InvalidStageError("Amistosos usam a dificuldade da fase de grupos")

        opponents = list_opponents(db)
        opponent = (
            _find_opponent(opponents, requested_opponent_id)
            if requested_opponent_id is not None
            else _select_opponent(opponents, stage)
        )
        stage_config = WORLD_CUP_STAGES[stage]

        result = simulate_match(user_ovr, opponent["overall"])
        user_score, opponent_score = generate_score(result)
        requires_penalties = (
            mode == "cup"
            and phase_index is not None
            and phase_index >= 3
            and result == "D"
        )
        coins_earned = (
            0
            if requires_penalties
            else calculate_reward(result, user_ovr, opponent["overall"])
        )
        goal_events = _generate_goal_events(
            user_score,
            opponent_score,
            starters,
            opponent,
            fallback_user_players=fallback_user_players,
            user_team_name=user["username"],
        )

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
        penalty_payload = None
        if requires_penalties:
            user_goalkeeper = _select_goalkeeper(starters, user_team=True)
            opponent_goalkeeper = _select_goalkeeper(
                opponent.get("players"),
                user_team=False,
            )
            shootout = draft_repository.create_penalty_shootout(
                db,
                match_id=match["id"],
                user_id=user_id,
                current_shooter_name=_penalty_shooter_name(
                    starters,
                    f"Cobrador do {user['username']}",
                ),
                available_shoot_zones=available_penalty_zones(
                    int(opponent_goalkeeper.get("overall") or opponent["overall"])
                ),
                user_goalkeeper_name=format_player_name(user_goalkeeper["name"]),
                user_goalkeeper_overall=int(user_goalkeeper.get("overall") or 60),
                opponent_goalkeeper_name=format_player_name(opponent_goalkeeper["name"]),
                opponent_goalkeeper_overall=int(
                    opponent_goalkeeper.get("overall") or opponent["overall"]
                ),
            )
            penalty_payload = _penalty_state_payload(shootout)
            campaign_payload = _campaign_payload(campaign)
        elif campaign is not None:
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
            "stage": stage,
            "stage_label": (
                CUP_PHASES[phase_index]
                if mode == "cup" and phase_index is not None
                else stage_config["label"]
            ),
            "score": {"user": user_score, "opponent": opponent_score},
            "result": result,
            "result_label": (
                "Empate - decisão por pênaltis"
                if requires_penalties
                else RESULT_LABELS[result]
            ),
            "coins_earned": coins_earned,
            "new_balance": new_balance,
            "played_at": match["played_at"],
            "mode": mode,
            "phase_index": phase_index,
            "goal_events": _serialize_goal_events(goal_events),
            "campaign": campaign_payload,
            "requires_penalties": requires_penalties,
            "penalty": penalty_payload,
        }
    except Exception:
        db.rollback()
        raise


def _finalize_penalty_match(db, *, user, shootout, winner: str, user_score: int, opponent_score: int):
    result = "W" if winner == "USER" else "L"
    coins_earned = calculate_reward(
        result,
        int(shootout["user_ovr"]),
        int(shootout["opponent_ovr"]),
    )
    draft_repository.finish_match_on_penalties(
        db,
        int(shootout["match_id"]),
        result=result,
        user_penalties=user_score,
        opponent_penalties=opponent_score,
        coins_earned=coins_earned,
    )

    campaign_payload = None
    if shootout["mode"] == "cup":
        campaign = draft_repository.get_or_create_campaign(db, int(shootout["user_id"]))
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
            int(shootout["user_id"]),
            int(user["coins"]) + coins_earned,
        )
        new_balance = int(updated_user["coins"])

    return {
        "result": result,
        "result_label": RESULT_LABELS[result],
        "coins_earned": coins_earned,
        "new_balance": new_balance,
        "campaign": campaign_payload,
    }


def _take_penalty(db, *, user_id: int, match_id: int, zone: str, expected_turn: str):
    try:
        user = user_repository.get_user(db, user_id, for_update=True)
        if user is None:
            raise NotFoundError("User not found")

        shootout = draft_repository.get_penalty_shootout_for_update(
            db,
            user_id,
            match_id,
        )
        if shootout is None:
            raise NotFoundError("Disputa de pênaltis não encontrada")
        if shootout["is_finished"]:
            raise BusinessRuleError("A disputa de pênaltis já terminou")
        if shootout["current_turn"] != expected_turn:
            raise BusinessRuleError("Esta não é a vez esperada da disputa")

        starters = draft_repository.list_user_starters(db, user_id)
        opponent = _find_opponent_by_name(
            list_opponents(db),
            shootout["opponent_name"],
        )
        attempt_shooter_name = shootout["current_shooter_name"]

        user_score = int(shootout["user_score"])
        opponent_score = int(shootout["opponent_score"])
        user_attempts = int(shootout["user_attempts"])
        opponent_attempts = int(shootout["opponent_attempts"])

        if expected_turn == "user_shoot":
            available_zones = list(shootout["available_shoot_zones"] or [])
            if zone not in available_zones:
                raise BusinessRuleError("Zona de chute indisponível para esta cobrança")
            shoot_zone = zone
            keeper_dive_zone = random.choice(PENALTY_ZONES)
            attempt_goalkeeper_name = shootout["opponent_goalkeeper_name"]
            user_attempts += 1
            scored = _penalty_scored(shoot_zone, keeper_dive_zone)
            user_score += int(scored)
            next_turn = "user_save"
            next_shooter_name = _penalty_shooter_name(
                opponent.get("players"),
                f"Cobrador da {opponent['name']}",
            )
        else:
            shoot_zone = random.choice(PENALTY_ZONES)
            keeper_dive_zone = zone
            attempt_goalkeeper_name = shootout["user_goalkeeper_name"]
            opponent_attempts += 1
            scored = _penalty_scored(shoot_zone, keeper_dive_zone)
            opponent_score += int(scored)
            next_turn = "user_shoot"
            next_shooter_name = _penalty_shooter_name(
                starters,
                f"Cobrador do {user['username']}",
            )

        draft_repository.create_penalty_attempt(
            db,
            shootout_id=int(shootout["shootout_id"]),
            turn=expected_turn,
            shooter_name=attempt_shooter_name,
            goalkeeper_name=attempt_goalkeeper_name,
            shoot_zone=shoot_zone,
            keeper_dive_zone=keeper_dive_zone,
            scored=scored,
        )

        winner = _penalty_winner(
            user_score,
            opponent_score,
            user_attempts,
            opponent_attempts,
        )
        updated_shootout = draft_repository.update_penalty_shootout(
            db,
            int(shootout["shootout_id"]),
            user_score=user_score,
            opponent_score=opponent_score,
            user_attempts=user_attempts,
            opponent_attempts=opponent_attempts,
            current_turn=next_turn,
            current_shooter_name=next_shooter_name,
            is_finished=winner is not None,
            winner=winner,
        )

        final_payload = {
            "result": None,
            "result_label": None,
            "coins_earned": 0,
            "new_balance": int(user["coins"]),
            "campaign": None,
        }
        if winner is not None:
            final_payload = _finalize_penalty_match(
                db,
                user=user,
                shootout=shootout,
                winner=winner,
                user_score=user_score,
                opponent_score=opponent_score,
            )

        response = {
            **_penalty_state_payload(updated_shootout),
            "turn": expected_turn,
            "attempt_shooter_name": attempt_shooter_name,
            "attempt_goalkeeper_name": attempt_goalkeeper_name,
            "shoot_zone": shoot_zone,
            "keeper_dive_zone": keeper_dive_zone,
            "scored": scored,
            "next_turn": None if winner is not None else next_turn,
            **final_payload,
        }
        db.commit()
        return response
    except Exception:
        db.rollback()
        raise


def shoot_penalty(db, *, user_id: int, match_id: int, shoot_zone: str):
    return _take_penalty(
        db,
        user_id=user_id,
        match_id=match_id,
        zone=shoot_zone,
        expected_turn="user_shoot",
    )


def save_penalty(db, *, user_id: int, match_id: int, dive_zone: str):
    return _take_penalty(
        db,
        user_id=user_id,
        match_id=match_id,
        zone=dive_zone,
        expected_turn="user_save",
    )


def get_active_penalty_match(db, user_id: int):
    user = user_repository.get_user(db, user_id)
    if user is None:
        raise NotFoundError("User not found")

    shootout = draft_repository.get_active_penalty_shootout(db, user_id)
    if shootout is None:
        return None

    opponent = _find_opponent_by_name(
        list_opponents(db),
        shootout["opponent_name"],
    )
    phase_index = int(shootout["phase_index"])
    stage = stage_for_phase(phase_index)
    campaign = draft_repository.get_campaign(db, user_id)
    return {
        "match_id": int(shootout["match_id"]),
        "user_id": user_id,
        "team_name": user["username"],
        "user_ovr": int(shootout["user_ovr"]),
        "opponent": opponent,
        "stage": stage,
        "stage_label": CUP_PHASES[phase_index],
        "score": {
            "user": int(shootout["regulation_user_score"]),
            "opponent": int(shootout["regulation_opponent_score"]),
        },
        "result": "D",
        "result_label": "Empate - decisão por pênaltis",
        "coins_earned": 0,
        "new_balance": int(user["coins"]),
        "played_at": shootout["played_at"],
        "mode": shootout["mode"],
        "phase_index": phase_index,
        "goal_events": _serialize_goal_events(
            draft_repository.list_goal_events(db, int(shootout["match_id"]))
        ),
        "campaign": _campaign_payload(campaign) if campaign is not None else None,
        "requires_penalties": True,
        "penalty": _penalty_state_payload(shootout),
    }


def get_history(db, user_id: int, *, limit: int = 20, offset: int = 0):
    if user_repository.get_user(db, user_id) is None:
        raise NotFoundError("User not found")

    history = []
    for row in draft_repository.list_history(db, user_id, limit=limit, offset=offset):
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
