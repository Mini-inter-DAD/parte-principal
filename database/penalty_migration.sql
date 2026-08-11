-- Interactive penalty shootouts for knockout Draft matches.
ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS decided_on_penalties BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS penalties_user_score SMALLINT;

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS penalties_opponent_score SMALLINT;

CREATE TABLE IF NOT EXISTS penalty_shootouts (
    id                          SERIAL PRIMARY KEY,
    match_id                    INTEGER NOT NULL UNIQUE
                                REFERENCES matches(id) ON DELETE CASCADE,
    user_id                     INTEGER NOT NULL
                                REFERENCES users(id) ON DELETE CASCADE,
    user_score                  SMALLINT NOT NULL DEFAULT 0,
    opponent_score              SMALLINT NOT NULL DEFAULT 0,
    user_attempts               SMALLINT NOT NULL DEFAULT 0,
    opponent_attempts           SMALLINT NOT NULL DEFAULT 0,
    current_turn                VARCHAR(20) NOT NULL DEFAULT 'user_shoot'
                                CHECK (current_turn IN ('user_shoot', 'user_save')),
    current_shooter_name        VARCHAR(100) NOT NULL,
    available_shoot_zones       JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_goalkeeper_name        VARCHAR(100) NOT NULL,
    user_goalkeeper_overall     SMALLINT NOT NULL,
    opponent_goalkeeper_name    VARCHAR(100) NOT NULL,
    opponent_goalkeeper_overall SMALLINT NOT NULL,
    is_finished                 BOOLEAN NOT NULL DEFAULT FALSE,
    winner                      VARCHAR(20)
                                CHECK (winner IN ('USER', 'OPPONENT')),
    created_at                  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_penalty_shootouts_user_active
    ON penalty_shootouts(user_id, is_finished);

CREATE TABLE IF NOT EXISTS penalty_attempts (
    id                       BIGSERIAL PRIMARY KEY,
    shootout_id              INTEGER NOT NULL
                             REFERENCES penalty_shootouts(id) ON DELETE CASCADE,
    turn                     VARCHAR(20) NOT NULL
                             CHECK (turn IN ('user_shoot', 'user_save')),
    shooter_name             VARCHAR(100) NOT NULL,
    goalkeeper_name          VARCHAR(100) NOT NULL,
    shoot_zone               VARCHAR(30) NOT NULL,
    keeper_dive_zone         VARCHAR(30) NOT NULL,
    scored                   BOOLEAN NOT NULL,
    created_at               TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_penalty_attempts_shootout
    ON penalty_attempts(shootout_id, id);
