-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    coins         INTEGER NOT NULL DEFAULT 15000 CHECK (coins >= 0),
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: admins
-- Administrative credentials. Store only password hashes.
-- ============================================================
CREATE TABLE admins (
    id             SERIAL PRIMARY KEY,
    username       VARCHAR(50) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_users_username_lower
    ON users (LOWER(username));

CREATE UNIQUE INDEX uq_admins_username_lower
    ON admins (LOWER(username));

-- Prevent the same username from existing in users and admins.
-- The advisory lock makes the check safe for concurrent inserts.
CREATE OR REPLACE FUNCTION enforce_unique_account_username()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(
        hashtextextended(LOWER(NEW.username), 0)
    );

    IF TG_TABLE_NAME = 'users' THEN
        IF EXISTS (
            SELECT 1
            FROM admins
            WHERE LOWER(username) = LOWER(NEW.username)
        ) THEN
            RAISE EXCEPTION 'username already exists'
                USING ERRCODE = '23505';
        END IF;
    ELSE
        IF EXISTS (
            SELECT 1
            FROM users
            WHERE LOWER(username) = LOWER(NEW.username)
        ) THEN
            RAISE EXCEPTION 'username already exists'
                USING ERRCODE = '23505';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_unique_account_username ON users;

CREATE TRIGGER trg_users_unique_account_username
BEFORE INSERT OR UPDATE OF username ON users
FOR EACH ROW
EXECUTE FUNCTION enforce_unique_account_username();

DROP TRIGGER IF EXISTS trg_admins_unique_account_username ON admins;

CREATE TRIGGER trg_admins_unique_account_username
BEFORE INSERT OR UPDATE OF username ON admins
FOR EACH ROW
EXECUTE FUNCTION enforce_unique_account_username();

-- ============================================================
-- TABLE: admin_sessions
-- Revocable sessions for administrative authentication.
-- ============================================================
CREATE TABLE admin_sessions (
    id          BIGSERIAL PRIMARY KEY,
    admin_id    INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token_hash  CHAR(64) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    ip_address  INET,
    user_agent  TEXT
);

CREATE INDEX idx_admin_sessions_admin_id
    ON admin_sessions(admin_id);

CREATE INDEX idx_admin_sessions_valid
    ON admin_sessions(token_hash, expires_at, revoked_at);

-- ============================================================
-- TABLE: user_activity_events
-- Successful user activity used for MAU reporting.
-- ============================================================
CREATE TABLE user_activity_events (
    id           BIGSERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type   VARCHAR(50) NOT NULL,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata     JSONB
);

CREATE INDEX idx_activity_events_date_user
    ON user_activity_events(occurred_at, user_id);

CREATE INDEX idx_activity_events_user_date
    ON user_activity_events(user_id, occurred_at);

-- ============================================================
-- PLAYERS
-- Catálogo global de jogadores
-- ============================================================
CREATE TABLE players (
    id             SERIAL PRIMARY KEY,

    ea_id          INTEGER UNIQUE,

    name           VARCHAR(100) NOT NULL,

    country        VARCHAR(60) NOT NULL,

    position       VARCHAR(5) NOT NULL,

    overall        SMALLINT NOT NULL
                   CHECK (overall BETWEEN 1 AND 99),

    club           VARCHAR(100),

    photo_url      VARCHAR(255),

    dominant_foot  VARCHAR(10),

    height         SMALLINT,

    price          INTEGER NOT NULL
                   CHECK (price >= 0)
);

-- ============================================================
-- USER PLAYERS
-- Jogadores pertencentes ao usuário
-- ============================================================
CREATE TABLE user_players (
    id              SERIAL PRIMARY KEY,

    user_id         INTEGER NOT NULL
                    REFERENCES users(id)
                    ON DELETE CASCADE,

    player_id       INTEGER NOT NULL
                    REFERENCES players(id)
                    ON DELETE RESTRICT,

    squad_position  VARCHAR(10),

    is_starter      BOOLEAN NOT NULL DEFAULT FALSE,

    acquired_at     TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE(user_id, player_id)
);

-- ============================================================
-- CART ITEMS
-- Jogadores separados para compra pelo usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
    id          SERIAL PRIMARY KEY,

    user_id     INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

    player_id   INTEGER NOT NULL
                REFERENCES players(id)
                ON DELETE CASCADE,

    created_at  TIMESTAMP NOT NULL DEFAULT now(),

    UNIQUE(user_id, player_id)
);

-- ============================================================
-- TRANSACTIONS
-- Histórico de compras
-- ============================================================
CREATE TABLE transactions (
    id            SERIAL PRIMARY KEY,

    user_id       INTEGER NOT NULL
                  REFERENCES users(id)
                  ON DELETE CASCADE,

    player_id     INTEGER NOT NULL
                  REFERENCES players(id)
                  ON DELETE RESTRICT,

    price_paid    INTEGER NOT NULL
                  CHECK (price_paid >= 0),

    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- MATCHES
-- Histórico de partidas
-- ============================================================
CREATE TABLE matches (
    id              SERIAL PRIMARY KEY,

    user_id         INTEGER NOT NULL
                    REFERENCES users(id)
                    ON DELETE CASCADE,

    user_ovr        SMALLINT NOT NULL,

    opponent_name   VARCHAR(60) NOT NULL,

    opponent_ovr    SMALLINT NOT NULL,

    user_score      SMALLINT NOT NULL,

    opponent_score  SMALLINT NOT NULL,

    result          CHAR(1) NOT NULL
                    CHECK (result IN ('W', 'L', 'D')),

    coins_earned    INTEGER NOT NULL DEFAULT 0
                    CHECK (coins_earned >= 0),

    played_at       TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- ESCALAÇÃO DO USUÁRIO NA PARTIDA
-- ============================================================
CREATE TABLE match_user_team (
    id          SERIAL PRIMARY KEY,

    match_id    INTEGER NOT NULL
                REFERENCES matches(id)
                ON DELETE CASCADE,

    player_id   INTEGER NOT NULL
                REFERENCES players(id)
                ON DELETE RESTRICT,

    position    VARCHAR(5),

    UNIQUE(match_id, player_id)
);

-- ============================================================
-- ESCALAÇÃO DO ADVERSÁRIO NA PARTIDA
-- ============================================================
CREATE TABLE match_opponent_team (
    id          SERIAL PRIMARY KEY,

    match_id    INTEGER NOT NULL
                REFERENCES matches(id)
                ON DELETE CASCADE,

    player_id   INTEGER NOT NULL
                REFERENCES players(id)
                ON DELETE RESTRICT,

    position    VARCHAR(5),

    UNIQUE(match_id, player_id)
);
