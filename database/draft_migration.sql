-- Migration for databases created before Draft campaign persistence.
-- The remote backend also expects these additive auth/metrics tables.
CREATE TABLE IF NOT EXISTS admins (
    id             SERIAL PRIMARY KEY,
    username       VARCHAR(50) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_admins_username_lower
    ON admins (LOWER(username));

CREATE TABLE IF NOT EXISTS admin_sessions (
    id          BIGSERIAL PRIMARY KEY,
    admin_id    INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token_hash  CHAR(64) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    ip_address  INET,
    user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id
    ON admin_sessions(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_valid
    ON admin_sessions(token_hash, expires_at, revoked_at);

CREATE TABLE IF NOT EXISTS user_activity_events (
    id           BIGSERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type   VARCHAR(50) NOT NULL,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata     JSONB
);

CREATE INDEX IF NOT EXISTS idx_activity_events_date_user
    ON user_activity_events(occurred_at, user_id);

CREATE INDEX IF NOT EXISTS idx_activity_events_user_date
    ON user_activity_events(user_id, occurred_at);

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS mode VARCHAR(10) NOT NULL DEFAULT 'friendly';

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS phase_index SMALLINT;

-- Preserve the World Cup roster mapping from the generated player data.
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS national_team VARCHAR(60);

UPDATE players
SET national_team = country
WHERE national_team IS NULL;

CREATE TABLE IF NOT EXISTS national_team_rosters (
    national_team   VARCHAR(60) NOT NULL,
    player_id       INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    roster_position VARCHAR(5),
    PRIMARY KEY (national_team, player_id)
);

CREATE INDEX IF NOT EXISTS idx_national_team_rosters_team
    ON national_team_rosters(national_team);

INSERT INTO national_team_rosters (national_team, player_id)
SELECT national_team, id
FROM players
WHERE national_team IS NOT NULL
ON CONFLICT (national_team, player_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS cup_campaigns (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phase_index     SMALLINT NOT NULL DEFAULT 0 CHECK (phase_index BETWEEN 0 AND 7),
    group_matches   SMALLINT NOT NULL DEFAULT 0 CHECK (group_matches BETWEEN 0 AND 3),
    group_points    SMALLINT NOT NULL DEFAULT 0 CHECK (group_points >= 0),
    group_losses    SMALLINT NOT NULL DEFAULT 0 CHECK (group_losses BETWEEN 0 AND 3),
    status          VARCHAR(12) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'COMPLETED', 'ELIMINATED')),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE cup_campaigns
    ADD COLUMN IF NOT EXISTS group_losses SMALLINT NOT NULL DEFAULT 0;

-- Backfill defeats from group matches already stored before this column existed.
WITH group_results AS (
    SELECT
        user_id,
        COUNT(*) FILTER (WHERE result = 'L') AS losses
    FROM matches
    WHERE mode = 'cup'
      AND phase_index BETWEEN 0 AND 2
    GROUP BY user_id
)
UPDATE cup_campaigns campaign
SET group_losses = results.losses,
    status = CASE
        WHEN campaign.phase_index < 3 AND results.losses >= 2 THEN 'ELIMINATED'
        ELSE campaign.status
    END,
    updated_at = now()
FROM group_results results
WHERE campaign.user_id = results.user_id;

UPDATE cup_campaigns
SET phase_index = group_matches
WHERE status = 'ACTIVE'
  AND group_matches BETWEEN 1 AND 2
  AND phase_index < 3;

-- Older databases may have counted losses across more than one campaign.
-- Keep the persisted value within the current campaign contract.
UPDATE cup_campaigns
SET group_matches = LEAST(GREATEST(group_matches, 0), 3),
    group_losses = LEAST(GREATEST(group_losses, 0), 3),
    updated_at = now();

CREATE TABLE IF NOT EXISTS goal_events (
    id              BIGSERIAL PRIMARY KEY,
    match_id        INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id       VARCHAR(64) NOT NULL,
    player_name     VARCHAR(100) NOT NULL,
    minute          SMALLINT NOT NULL CHECK (minute BETWEEN 0 AND 120),
    position        VARCHAR(10),
    team            VARCHAR(10) NOT NULL CHECK (team IN ('USER', 'OPPONENT'))
);

CREATE INDEX IF NOT EXISTS idx_goal_events_match_id ON goal_events(match_id);

-- Interactive penalty shootouts for knockout Draft matches.
ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS decided_on_penalties BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS penalties_user_score SMALLINT;

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS penalties_opponent_score SMALLINT;

CREATE TABLE IF NOT EXISTS penalty_shootouts (
    id                          SERIAL PRIMARY KEY,
    match_id                    INTEGER NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
    user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_score                  SMALLINT NOT NULL DEFAULT 0,
    opponent_score              SMALLINT NOT NULL DEFAULT 0,
    user_attempts               SMALLINT NOT NULL DEFAULT 0,
    opponent_attempts           SMALLINT NOT NULL DEFAULT 0,
    current_turn                VARCHAR(20) NOT NULL DEFAULT 'user_shoot'
                                CHECK (current_turn IN ('user_shoot', 'user_save')),
    current_shooter_name        VARCHAR(100) NOT NULL,
    available_shoot_zones       JSONB NOT NULL DEFAULT '[]'::jsonb,
    opponent_available_shoot_zones JSONB NOT NULL
                                DEFAULT '["top_left", "top_center", "top_right", "bottom_left", "bottom_right"]'::jsonb,
    user_goalkeeper_name        VARCHAR(100) NOT NULL,
    user_goalkeeper_overall     SMALLINT NOT NULL,
    opponent_goalkeeper_name    VARCHAR(100) NOT NULL,
    opponent_goalkeeper_overall SMALLINT NOT NULL,
    is_finished                 BOOLEAN NOT NULL DEFAULT FALSE,
    winner                      VARCHAR(20) CHECK (winner IN ('USER', 'OPPONENT')),
    created_at                  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE penalty_shootouts
    ADD COLUMN IF NOT EXISTS opponent_available_shoot_zones JSONB NOT NULL
    DEFAULT '["top_left", "top_center", "top_right", "bottom_left", "bottom_right"]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_penalty_shootouts_user_active
    ON penalty_shootouts(user_id, is_finished);

CREATE TABLE IF NOT EXISTS penalty_attempts (
    id                   BIGSERIAL PRIMARY KEY,
    shootout_id          INTEGER NOT NULL REFERENCES penalty_shootouts(id) ON DELETE CASCADE,
    turn                 VARCHAR(20) NOT NULL CHECK (turn IN ('user_shoot', 'user_save')),
    shooter_name         VARCHAR(100) NOT NULL,
    goalkeeper_name      VARCHAR(100) NOT NULL,
    shoot_zone           VARCHAR(30) NOT NULL,
    keeper_dive_zone     VARCHAR(30) NOT NULL,
    scored               BOOLEAN NOT NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_penalty_attempts_shootout
    ON penalty_attempts(shootout_id, id);

-- Repair old data created before the backend enforced one player per slot.
WITH starter_rows AS (
    SELECT
        up.id,
        up.user_id,
        UPPER(up.squad_position) AS slot,
        p.overall,
        ROW_NUMBER() OVER (
            PARTITION BY up.user_id, UPPER(up.squad_position)
            ORDER BY p.overall DESC, up.acquired_at ASC, up.id ASC
        ) AS slot_rank
    FROM user_players up
    JOIN players p ON p.id = up.player_id
    WHERE up.is_starter = TRUE
      AND up.squad_position IS NOT NULL
), unique_slots AS (
    SELECT id, user_id, slot, overall
    FROM starter_rows
    WHERE slot_rank = 1
), ordered_slots AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY
                CASE slot
                    WHEN 'GK' THEN 1
                    WHEN 'LB' THEN 2
                    WHEN 'CB1' THEN 3
                    WHEN 'CB2' THEN 4
                    WHEN 'RB' THEN 5
                    WHEN 'CM1' THEN 6
                    WHEN 'CM2' THEN 7
                    WHEN 'CM3' THEN 8
                    WHEN 'LW' THEN 9
                    WHEN 'RW' THEN 10
                    WHEN 'ST' THEN 11
                    WHEN 'LWB' THEN 12
                    WHEN 'RWB' THEN 13
                    WHEN 'CB3' THEN 14
                    WHEN 'CDM1' THEN 15
                    WHEN 'CDM2' THEN 16
                    WHEN 'CAM' THEN 17
                    WHEN 'LM' THEN 18
                    WHEN 'RM' THEN 19
                    WHEN 'ST1' THEN 20
                    WHEN 'ST2' THEN 21
                    ELSE 99
                END,
                overall DESC,
                id ASC
        ) AS roster_rank
    FROM unique_slots
), keepers AS (
    SELECT id
    FROM ordered_slots
    WHERE roster_rank <= 11
)
UPDATE user_players up
SET is_starter = FALSE,
    squad_position = NULL
WHERE up.is_starter = TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM keepers
      WHERE keepers.id = up.id
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_players_starter_slot
    ON user_players(user_id, UPPER(squad_position))
    WHERE is_starter = TRUE AND squad_position IS NOT NULL;
