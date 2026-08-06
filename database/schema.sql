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
