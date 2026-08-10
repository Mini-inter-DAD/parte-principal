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
            SELECT p.id, p.name, p.position, p.overall, p.club, p.photo_url,
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
            SELECT p.id, p.name, p.position, p.overall, up.squad_position
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


def list_history(db: Session, user_id: int, limit: int = 20, offset: int = 0):
    result = db.execute(
        text("""
            SELECT id, user_ovr, opponent_name, opponent_ovr,
                   user_score, opponent_score, result, coins_earned, played_at,
                   mode, phase_index
            FROM matches
            WHERE user_id = :user_id
            ORDER BY played_at DESC, id DESC
            LIMIT :limit
            OFFSET :offset
        """),
        {"user_id": user_id, "limit": limit, "offset": offset},
    )
    return result.mappings().all()
