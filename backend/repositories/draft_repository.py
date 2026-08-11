import json

from sqlalchemy import text
from sqlalchemy.orm import Session


# A prévia e a partida do Draft usam o campo padrão 4-3-3. Um jogador só
# conta como titular quando a posição salva no elenco corresponde a uma destas vagas.
DRAFT_STARTER_SLOTS = (
    "GK", "LB", "CB1", "CB2", "RB",
    "CM1", "CM2", "CM3", "LW", "ST", "RW",
)


def list_national_team_players(db: Session):
    result = db.execute(
        text("""
            SELECT p.id, p.ea_id, p.name, p.position, p.overall, p.club, p.photo_url,
                   roster.national_team
            FROM national_team_rosters roster
            JOIN players p ON p.id = roster.player_id
            WHERE TRIM(roster.national_team) <> ''
            ORDER BY roster.national_team ASC, p.overall DESC, p.name ASC, p.id ASC
        """)
    )
    return result.mappings().all()


def list_user_overalls(db: Session, user_id: int):
    result = db.execute(
        text("""
            SELECT p.overall
            FROM user_players up
            JOIN players p ON p.id = up.player_id
            WHERE up.user_id = :user_id
            ORDER BY up.is_starter DESC, p.overall DESC, p.name ASC
            LIMIT 11
        """),
        {"user_id": user_id},
    )
    return [row["overall"] for row in result.mappings().all()]


def count_valid_starters(db: Session, user_id: int) -> int:
    result = db.execute(
        text("""
            SELECT COUNT(DISTINCT UPPER(TRIM(squad_position)))
            FROM user_players
            WHERE user_id = :user_id
              AND is_starter = TRUE
              AND UPPER(TRIM(squad_position)) IN (
                  'GK', 'LB', 'CB1', 'CB2', 'RB',
                  'CM1', 'CM2', 'CM3', 'LW', 'ST', 'RW'
              )
        """),
        {"user_id": user_id},
    )
    return int(result.scalar_one())


def list_user_starters(db: Session, user_id: int):
    result = db.execute(
        text("""
            SELECT p.id, p.ea_id, p.name, p.position, p.overall, up.squad_position
            FROM user_players up
            JOIN players p ON p.id = up.player_id
            WHERE up.user_id = :user_id
              AND up.is_starter = TRUE
              AND UPPER(TRIM(up.squad_position)) IN (
                  'GK', 'LB', 'CB1', 'CB2', 'RB',
                  'CM1', 'CM2', 'CM3', 'LW', 'ST', 'RW'
              )
            ORDER BY CASE UPPER(TRIM(up.squad_position))
                WHEN 'GK' THEN 1
                WHEN 'LB' THEN 2
                WHEN 'CB1' THEN 3
                WHEN 'CB2' THEN 4
                WHEN 'RB' THEN 5
                WHEN 'CM1' THEN 6
                WHEN 'CM2' THEN 7
                WHEN 'CM3' THEN 8
                WHEN 'LW' THEN 9
                WHEN 'ST' THEN 10
                WHEN 'RW' THEN 11
            END,
            p.name
            LIMIT 11
        """),
        {"user_id": user_id},
    )
    return result.mappings().all()


def get_or_create_campaign(db: Session, user_id: int):
    db.execute(
        text("""
            INSERT INTO cup_campaigns (user_id)
            VALUES (:user_id)
            ON CONFLICT (user_id) DO NOTHING
        """),
        {"user_id": user_id},
    )
    result = db.execute(
        text("""
            SELECT id, user_id, phase_index, group_matches, group_points,
                   group_losses, status, updated_at
            FROM cup_campaigns
            WHERE user_id = :user_id
            FOR UPDATE
        """),
        {"user_id": user_id},
    )
    return result.mappings().one()


def get_campaign(db: Session, user_id: int):
    result = db.execute(
        text("""
            SELECT id, user_id, phase_index, group_matches, group_points,
                   group_losses, status, updated_at
            FROM cup_campaigns
            WHERE user_id = :user_id
        """),
        {"user_id": user_id},
    )
    return result.mappings().first()


def update_campaign(
    db: Session,
    campaign_id: int,
    *,
    phase_index: int,
    group_matches: int,
    group_points: int,
    group_losses: int,
    status: str,
):
    result = db.execute(
        text("""
            UPDATE cup_campaigns
            SET phase_index = :phase_index,
                group_matches = :group_matches,
                group_points = :group_points,
                group_losses = :group_losses,
                status = :status,
                updated_at = now()
            WHERE id = :campaign_id
            RETURNING id, user_id, phase_index, group_matches,
                      group_points, group_losses, status, updated_at
        """),
        {
            "campaign_id": campaign_id,
            "phase_index": phase_index,
            "group_matches": group_matches,
            "group_points": group_points,
            "group_losses": group_losses,
            "status": status,
        },
    )
    return result.mappings().one()


def create_goal_events(db: Session, match_id: int, events: list[dict]):
    for event in events:
        db.execute(
            text("""
                INSERT INTO goal_events (
                    match_id, player_id, player_name, minute, position, team
                )
                VALUES (
                    :match_id, :player_id, :player_name, :minute, :position, :team
                )
            """),
            {"match_id": match_id, **event},
        )


def list_goal_events(db: Session, match_id: int):
    result = db.execute(
        text("""
            SELECT player_id, player_name, minute, position, team
            FROM goal_events
            WHERE match_id = :match_id
            ORDER BY minute ASC, id ASC
        """),
        {"match_id": match_id},
    )
    return result.mappings().all()


def create_match(
    db: Session,
    *,
    user_id: int,
    user_ovr: int,
    opponent_name: str,
    opponent_ovr: int,
    user_score: int,
    opponent_score: int,
    result: str,
    coins_earned: int,
    mode: str,
    phase_index: int | None,
):
    created = db.execute(
        text("""
            INSERT INTO matches (
                user_id, user_ovr, opponent_name, opponent_ovr,
                user_score, opponent_score, result, coins_earned, mode, phase_index
            )
            VALUES (
                :user_id, :user_ovr, :opponent_name, :opponent_ovr,
                :user_score, :opponent_score, :result, :coins_earned, :mode, :phase_index
            )
            RETURNING id, user_id, user_ovr, opponent_name, opponent_ovr,
                      user_score, opponent_score, result, coins_earned, played_at,
                      mode, phase_index
        """),
        {
            "user_id": user_id,
            "user_ovr": user_ovr,
            "opponent_name": opponent_name,
            "opponent_ovr": opponent_ovr,
            "user_score": user_score,
            "opponent_score": opponent_score,
            "result": result,
            "coins_earned": coins_earned,
            "mode": mode,
            "phase_index": phase_index,
        },
    )
    return created.mappings().one()


def create_penalty_shootout(
    db: Session,
    *,
    match_id: int,
    user_id: int,
    current_shooter_name: str,
    available_shoot_zones: list[str],
    user_goalkeeper_name: str,
    user_goalkeeper_overall: int,
    opponent_goalkeeper_name: str,
    opponent_goalkeeper_overall: int,
):
    result = db.execute(
        text("""
            INSERT INTO penalty_shootouts (
                match_id, user_id, current_shooter_name, available_shoot_zones,
                user_goalkeeper_name, user_goalkeeper_overall,
                opponent_goalkeeper_name, opponent_goalkeeper_overall
            )
            VALUES (
                :match_id, :user_id, :current_shooter_name,
                CAST(:available_shoot_zones AS JSONB),
                :user_goalkeeper_name, :user_goalkeeper_overall,
                :opponent_goalkeeper_name, :opponent_goalkeeper_overall
            )
            RETURNING *
        """),
        {
            "match_id": match_id,
            "user_id": user_id,
            "current_shooter_name": current_shooter_name,
            "available_shoot_zones": json.dumps(available_shoot_zones),
            "user_goalkeeper_name": user_goalkeeper_name,
            "user_goalkeeper_overall": user_goalkeeper_overall,
            "opponent_goalkeeper_name": opponent_goalkeeper_name,
            "opponent_goalkeeper_overall": opponent_goalkeeper_overall,
        },
    )
    return result.mappings().one()


def get_active_penalty_shootout(db: Session, user_id: int):
    result = db.execute(
        text("""
            SELECT
                shootout.id AS shootout_id,
                shootout.match_id,
                shootout.user_id,
                shootout.user_score,
                shootout.opponent_score,
                shootout.user_attempts,
                shootout.opponent_attempts,
                shootout.current_turn,
                shootout.current_shooter_name,
                shootout.available_shoot_zones,
                shootout.user_goalkeeper_name,
                shootout.user_goalkeeper_overall,
                shootout.opponent_goalkeeper_name,
                shootout.opponent_goalkeeper_overall,
                shootout.is_finished,
                shootout.winner,
                match.user_ovr,
                match.opponent_name,
                match.opponent_ovr,
                match.user_score AS regulation_user_score,
                match.opponent_score AS regulation_opponent_score,
                match.result,
                match.coins_earned,
                match.mode,
                match.phase_index,
                match.played_at
            FROM penalty_shootouts shootout
            JOIN matches match ON match.id = shootout.match_id
            WHERE shootout.user_id = :user_id
              AND shootout.is_finished = FALSE
            ORDER BY shootout.created_at DESC, shootout.id DESC
            LIMIT 1
        """),
        {"user_id": user_id},
    )
    return result.mappings().first()


def get_penalty_shootout_for_update(db: Session, user_id: int, match_id: int):
    result = db.execute(
        text("""
            SELECT
                shootout.id AS shootout_id,
                shootout.match_id,
                shootout.user_id,
                shootout.user_score,
                shootout.opponent_score,
                shootout.user_attempts,
                shootout.opponent_attempts,
                shootout.current_turn,
                shootout.current_shooter_name,
                shootout.available_shoot_zones,
                shootout.user_goalkeeper_name,
                shootout.user_goalkeeper_overall,
                shootout.opponent_goalkeeper_name,
                shootout.opponent_goalkeeper_overall,
                shootout.is_finished,
                shootout.winner,
                match.user_ovr,
                match.opponent_name,
                match.opponent_ovr,
                match.user_score AS regulation_user_score,
                match.opponent_score AS regulation_opponent_score,
                match.result,
                match.coins_earned,
                match.mode,
                match.phase_index,
                match.played_at
            FROM penalty_shootouts shootout
            JOIN matches match ON match.id = shootout.match_id
            WHERE shootout.user_id = :user_id
              AND shootout.match_id = :match_id
            FOR UPDATE OF shootout, match
        """),
        {"user_id": user_id, "match_id": match_id},
    )
    return result.mappings().first()


def update_penalty_shootout(
    db: Session,
    shootout_id: int,
    *,
    user_score: int,
    opponent_score: int,
    user_attempts: int,
    opponent_attempts: int,
    current_turn: str,
    current_shooter_name: str,
    is_finished: bool,
    winner: str | None,
):
    result = db.execute(
        text("""
            UPDATE penalty_shootouts
            SET user_score = :user_score,
                opponent_score = :opponent_score,
                user_attempts = :user_attempts,
                opponent_attempts = :opponent_attempts,
                current_turn = :current_turn,
                current_shooter_name = :current_shooter_name,
                is_finished = :is_finished,
                winner = :winner,
                updated_at = now()
            WHERE id = :shootout_id
            RETURNING *
        """),
        {
            "shootout_id": shootout_id,
            "user_score": user_score,
            "opponent_score": opponent_score,
            "user_attempts": user_attempts,
            "opponent_attempts": opponent_attempts,
            "current_turn": current_turn,
            "current_shooter_name": current_shooter_name,
            "is_finished": is_finished,
            "winner": winner,
        },
    )
    return result.mappings().one()


def create_penalty_attempt(
    db: Session,
    *,
    shootout_id: int,
    turn: str,
    shooter_name: str,
    goalkeeper_name: str,
    shoot_zone: str,
    keeper_dive_zone: str,
    scored: bool,
):
    result = db.execute(
        text("""
            INSERT INTO penalty_attempts (
                shootout_id, turn, shooter_name, goalkeeper_name,
                shoot_zone, keeper_dive_zone, scored
            )
            VALUES (
                :shootout_id, :turn, :shooter_name, :goalkeeper_name,
                :shoot_zone, :keeper_dive_zone, :scored
            )
            RETURNING *
        """),
        {
            "shootout_id": shootout_id,
            "turn": turn,
            "shooter_name": shooter_name,
            "goalkeeper_name": goalkeeper_name,
            "shoot_zone": shoot_zone,
            "keeper_dive_zone": keeper_dive_zone,
            "scored": scored,
        },
    )
    return result.mappings().one()


def finish_match_on_penalties(
    db: Session,
    match_id: int,
    *,
    result: str,
    user_penalties: int,
    opponent_penalties: int,
    coins_earned: int,
):
    updated = db.execute(
        text("""
            UPDATE matches
            SET result = :result,
                coins_earned = :coins_earned,
                decided_on_penalties = TRUE,
                penalties_user_score = :user_penalties,
                penalties_opponent_score = :opponent_penalties
            WHERE id = :match_id
            RETURNING *
        """),
        {
            "match_id": match_id,
            "result": result,
            "coins_earned": coins_earned,
            "user_penalties": user_penalties,
            "opponent_penalties": opponent_penalties,
        },
    )
    return updated.mappings().one()


def list_history(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    result = db.execute(
        text("""
            SELECT id, user_ovr, opponent_name, opponent_ovr,
                   user_score, opponent_score, result, coins_earned, played_at,
                   mode, phase_index, decided_on_penalties,
                   penalties_user_score, penalties_opponent_score
            FROM matches
            WHERE user_id = :user_id
            ORDER BY played_at DESC, id DESC
            LIMIT :limit
            OFFSET :offset
        """),
        {"user_id": user_id, "limit": limit, "offset": offset},
    )
    return result.mappings().all()
