# Banco de Dados

PostgreSQL 17 executado via Docker Compose. Schema completo em `database/schema.sql`; conexão via SQLAlchemy Core em `database/connection.py` (as queries são SQL puro com `text()`, sem ORM mapeando tabelas).

## Diagrama de relacionamentos

```
users 1 ── N user_players N ── 1 players
users 1 ── N cart_items   N ── 1 players
users 1 ── N transactions N ── 1 players
users 1 ── N matches
admins 1 ── N admin_sessions
users 1 ── N user_activity_events
```

## Tabelas

### users
Contas de jogadores.

| Coluna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| username | VARCHAR(50) | UNIQUE (case-insensitive via índice funcional) |
| email | VARCHAR(100) | UNIQUE |
| password_hash | VARCHAR(255) | PBKDF2-HMAC-SHA256 |
| coins | INTEGER | padrão **15.000**, `CHECK >= 0` |
| created_at | TIMESTAMP | padrão `now()` |

### admins
Credenciais administrativas (apenas hashes de senha).

| Coluna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| username | VARCHAR(50) | UNIQUE (case-insensitive) |
| password_hash | VARCHAR(255) | mesmo formato de `users` |
| is_active | BOOLEAN | padrão `TRUE` |
| created_at | TIMESTAMPTZ | padrão `now()` |

### admin_sessions
Sessões revogáveis de autenticação administrativa.

| Coluna | Tipo | Notas |
|---|---|---|
| id | BIGSERIAL PK | |
| admin_id | INTEGER FK → admins | ON DELETE CASCADE |
| token_hash | CHAR(64) | SHA-256 do token, UNIQUE |
| created_at / expires_at | TIMESTAMPTZ | TTL de 8 horas |
| revoked_at | TIMESTAMPTZ | preenchido no logout |
| ip_address | INET | |
| user_agent | TEXT | |

### user_activity_events
Atividade bem-sucedida de usuários, usada para relatório de MAU.

| Coluna | Tipo | Notas |
|---|---|---|
| id | BIGSERIAL PK | |
| user_id | INTEGER FK → users | ON DELETE CASCADE |
| event_type | VARCHAR(50) | ex.: `login` |
| occurred_at | TIMESTAMPTZ | padrão `now()` |
| metadata | JSONB | |

### players
Catálogo global de jogadores (WC 2026).

| Coluna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| ea_id | INTEGER | UNIQUE; `NULL` para jogadores sem registro na EA |
| name | VARCHAR(100) | |
| country | VARCHAR(60) | |
| position | VARCHAR(5) | código FIFA (GK, CB, CM, ST…) |
| overall | SMALLINT | `CHECK` 1–99 |
| club | VARCHAR(100) | |
| photo_url | VARCHAR(255) | CDN da Futwiz |
| dominant_foot | VARCHAR(10) | |
| height | SMALLINT | |
| price | INTEGER | `CHECK >= 0` — **informativo**; a API recalcula o preço |

### user_players
Jogadores que pertencem ao usuário.

| Coluna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| user_id | INTEGER FK → users | ON DELETE CASCADE |
| player_id | INTEGER FK → players | ON DELETE RESTRICT |
| squad_position | VARCHAR(10) | vaga no esquema (ex.: `CB1`, `CM2`) |
| is_starter | BOOLEAN | padrão `FALSE` |
| acquired_at | TIMESTAMP | padrão `now()` |
| — | — | `UNIQUE(user_id, player_id)` |

### cart_items
Jogadores separados para compra.

| Coluna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| user_id | INTEGER FK → users | ON DELETE CASCADE |
| player_id | INTEGER FK → players | ON DELETE CASCADE |
| created_at | TIMESTAMP | padrão `now()` |
| — | — | `UNIQUE(user_id, player_id)` |

### transactions
Histórico de compras.

| Coluna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| user_id | INTEGER FK → users | ON DELETE CASCADE |
| player_id | INTEGER FK → players | ON DELETE RESTRICT |
| price_paid | INTEGER | `CHECK >= 0` |
| created_at | TIMESTAMP | padrão `now()` |

### matches
Histórico de partidas do draft.

| Coluna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| user_id | INTEGER FK → users | ON DELETE CASCADE |
| user_ovr / opponent_ovr | SMALLINT | overalls na partida |
| opponent_name | VARCHAR(60) | |
| user_score / opponent_score | SMALLINT | |
| result | CHAR(1) | `CHECK IN ('W','L','D')` |
| coins_earned | INTEGER | padrão 0, `CHECK >= 0` |
| played_at | TIMESTAMP | padrão `now()` |

### match_user_team / match_opponent_team
Escalações da partida (titular e adversário). **Definidas no schema, mas não utilizadas pelos repositórios atuais.**

| Coluna | Tipo | Notas |
|---|---|---|
| id | SERIAL PK | |
| match_id | INTEGER FK → matches | ON DELETE CASCADE |
| player_id | INTEGER FK → players | ON DELETE RESTRICT |
| position | VARCHAR(5) | |
| — | — | `UNIQUE(match_id, player_id)` |

## Constraints e triggers

- **Índices únicos case-insensitive**: `uq_users_username_lower` e `uq_admins_username_lower` sobre `LOWER(username)`.
- **Trigger `enforce_unique_account_username()`**: impede que o mesmo username exista em `users` e `admins`. Usa `pg_advisory_xact_lock(hashtextextended(LOWER(username)))` para tornar a checagem segura sob concorrência.
- **Índices**:
  - `admin_sessions`: por `admin_id` e por `(token_hash, expires_at, revoked_at)`.
  - `user_activity_events`: por `(occurred_at, user_id)` e `(user_id, occurred_at)`.

## Seed

- **`seed_players.py`**: lê `output/players.json` (ou `artifacts/players.json` como fallback), cruza posições com `data/ea_fc26_players.csv`, calcula preço via escada de precificação e faz upsert em `players` (`ON CONFLICT (ea_id) DO UPDATE`). Jogadores sem `ea_id` são deduplicados por (nome, país, posição, overall, clube, foto).
- **Novo usuário**: `user_service.create_user` concede 12 jogadores aleatórios (overall 60–70); os 11 primeiros viram titulares na posição natural e o 12º é reserva. Se houver menos de 12 jogadores no catálogo, o cadastro falha.
- **`admin_username_migration.sql`**: exemplo de migração para criação de administrador.

## Regras de escalação (22 vagas)

Fonte: `backend/services/position_rules.py` (`FORMATION_SLOTS`).

| Vaga | Posições permitidas |
|---|---|
| GK | GK |
| LB | LB, LWB |
| RB | RB, RWB |
| CB1/CB2/CB3 | CB, DF |
| LWB | LWB, LM, LB |
| RWB | RWB, RM, RB |
| CDM | CDM |
| CDM1/CDM2 | CDM, CM |
| CM1/CM2/CM3 | CM, MC, MF, CDM, CAM |
| CAM | CAM, CM |
| LM | LM, LW, CM |
| RM | RM, RW, CM |
| LW | LW, LM |
| RW | RW, RM |
| ST/ST1/ST2 | ST, CF, FW |
