# Backend — Referência da API

API REST construída com FastAPI e SQLAlchemy Core (SQL puro). Aplicação em `backend/app.py`; documentação interativa em `/docs` (Swagger).

- Base URL padrão: `http://localhost:8000`
- CORS: aberto (`allow_origins=["*"]`)

## Rotas de sistema

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Mensagem de boas-vindas |
| GET | `/health` | Health check (`{"status": "ok"}`) |

## Autenticação

### Usuário

- Token **stateless**: apenas `user:<id>` (sem expiração). Enviado como `Authorization: Bearer user:<id>`.
- Nas rotas protegidas por `current_user_id`, o `user_id` é extraído do token (o cliente não envia o id no corpo).
- Em `/users`, `/market/buy`, `/cart` e `/draft` o `user_id` é enviado no corpo da requisição.

### Administrador

- Login unificado: `POST /auth/login` retorna `account_type: "user" | "admin"`.
- Sessões revogáveis: token aleatório de 32 bytes, armazenado como hash SHA-256, válido por **8 horas**, com logout revogando a sessão (`revoked_at`).
- Endpoints administrativos exigem `Authorization: Bearer <token_admin>` (resolvido por `current_admin_id`).

### Credenciais

- Senhas: PBKDF2-HMAC-SHA256, salt de 16 bytes, 120.000 iterações. Formato `pbkdf2_sha256$120000$<salt>$<digest>` (usuários e admins).
- Username é **globalmente único entre usuários e admins**, com checagem case-insensitive (ver [`banco-de-dados.md`](banco-de-dados.md)).

## Usuários

### `POST /users` — criar usuário (201)

```json
{ "username": "jose", "password": "123456", "email": "jose@x.com" }
```

`email` é opcional (padrão `{username}@dreamcup.local`). Ao criar, o usuário recebe automaticamente **12 jogadores aleatórios (overall 60–70)**: 11 titulares e 1 reserva.

Resposta: `UserResponse` (`id`, `username`, `email`, `coins`).

### `GET /users/{user_id}` — dados do usuário

Resposta: `UserResponse`.

### `POST /auth/register` — criar e autenticar (201)

Resposta: `{ "token": "user:<id>", "user": UserResponse }`.

### `POST /auth/login` — login unificado

Corpo: `{ "username", "password" }`.

Resposta:

```json
{
  "token": "user:<id>",
  "account_type": "user",
  "user": { "id": 1, "username": "jose", "email": "jose@x.com", "coins": 15000 }
}
```

Para admin: `account_type: "admin"`, campo `admin` com `{ "id", "username" }`, e token de sessão.

### `POST /auth/forgot-password`

Recuperação de senha não implementada no MVP — responde com mensagem informativa.

## Jogadores

| Método | Rota | Descrição |
|---|---|---|
| GET | `/players` | Lista jogadores com filtros `name`, `country`, `position`, `limit` (1–100, padrão 50) |
| GET | `/players/search?q=` | Busca por nome, insensível a acentos/espaços |
| GET | `/players/{player_id}` | Jogador por id |

`PlayerResponse`:

```json
{
  "id": 1, "ea_id": 238794, "name": "Lionel Messi",
  "country": "Argentina", "nationality": "Argentina", "nationality_pt": "Argentina",
  "country_code": "AR", "position": "ST", "overall": 91, "ovr": 91,
  "club": "Inter Miami", "photo_url": "...", "photo": "...",
  "dominant_foot": null, "height": null, "price": 15000, "section": null
}
```

Detalhes de formatação: nome em title case, nacionalidade traduzida para português (`nationality_pt`), `ovr`/`photo` são aliases de `overall`/`photo_url`, e `price` é sempre **recalculado** pela escada de preços (nunca lido do banco).

## Mercado

### `GET /market` e `GET /market/players` — listar mercado

Filtros: `q`, `nation`, `position`, `ovrMin`, `ovrMax`, `priceMin`, `priceMax`, `section`.

- `nation` aceita nomes em português ou inglês (ex.: `França`, `Brasil`).
- `section` aceita os valores de [`GET /market/sections`](#get-marketsections).
- Validação: mínimo ≤ máximo nas faixas de overall e preço.

### `GET /market/sections` — seções do mercado

Seções derivadas do overall:

| Seção | Faixa |
|---|---|
| `Estrelas` | overall ≥ 90 |
| `Destaques da Copa` | overall ≥ 85 |
| `Veteranos` | demais |

### `POST /market/buy` — comprar jogador

Corpo: `{ "user_id": 1, "player_id": 5 }`.

Regras:
- Jogador já pertencente ao usuário → `409 Conflict`.
- Moedas insuficientes → `400` (preço = escada de preços).
- Usa bloqueio `FOR UPDATE` na linha do usuário (transação atômica).

Resposta: `{ "message", "user_id", "player_id", "price_paid", "coins" }`.

## Carrinho

| Método | Rota | Descrição |
|---|---|---|
| GET | `/cart/{user_id}` | Carrinho do usuário |
| POST | `/cart/add` | `{ "user_id", "player_id" }` — adiciona item |
| DELETE | `/cart/remove` | `{ "user_id", "player_id" }` — remove item |
| DELETE | `/cart/clear/{user_id}` | Esvazia o carrinho |
| POST | `/cart/checkout` | `{ "user_id" }` — compra tudo |

`CartResponse`: `{ "user_id", "items": [PlayerResponse], "total", "coins" }`.

Regras:
- Item já pertencente ao usuário ou já no carrinho → `409 Conflict`.
- Checkout é **tudo ou nada**: qualquer item já pertencente aborta a compra; carrinho vazio → erro; moedas insuficientes → erro. Deduz moedas, insere em `user_players`, registra transações e limpa o carrinho em uma única transação.
- `CartCheckoutResponse`: `{ "message", "user_id", "player_ids", "total", "coins" }`.

## Elenco (Squad)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/squad` | Elenco do usuário autenticado pelo token |
| GET | `/squad/{user_id}` | Elenco de um usuário |
| POST | `/squad/buy/{player_id}` | Compra direta para o usuário autenticado |
| PATCH | `/squad/substitute` | Substitui titular por reserva |
| PATCH | `/squad/assign-position` | Escala jogador numa posição do esquema |
| PATCH | `/squad/move-to-bench` | Move para o banco |
| PATCH | `/squad/starter` | Define/remove titularidade (corpo) |
| PATCH | `/squad/starter/{player_id}` | Define como titular pelo token |

`SquadPlayerResponse` estende `PlayerResponse` com `is_starter`, `squad_position`, `acquired_at`.

### Regras de escalação

- O elenco tem **22 vagas** de escalação (ver [`banco-de-dados.md`](banco-de-dados.md) / `position_rules.py`): GK, LB, RB, CB1–3, LWB, RWB, CDM, CDM1–2, CM1–3, CAM, LM, RM, LW, RW, ST, ST1–2.
- Cada vaga aceita apenas posições compatíveis (ex.: CB1 aceita `CB` e `DF`; ST aceita `ST`, `CF` e `FW`). Escalar jogador incompatível → `400`.
- `assign-position`: se a vaga estiver ocupada, o titular anterior é **movido para o banco** e a resposta traz `replaced_player_id`.
- `substitute`: troca exatamente dois jogadores (titular ↔ reserva), validando compatibilidade do reserva com a vaga do titular.

## Draft (Partidas)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/draft/opponents` | Seleções adversárias disponíveis |
| POST | `/draft/play` | Joga uma partida |
| GET | `/draft/history/{user_id}` | Histórico (últimas 20) |

Adversários fixos:

| id | Seleção | overall |
|---|---|---|
| `japan` | Japão | 74 |
| `usa` | Estados Unidos | 78 |
| `mexico` | México | 80 |
| `morocco` | Marrocos | 82 |
| `france` | França | 89 |

### `POST /draft/play`

Corpo: `{ "user_id": 1, "opponent_id": "france" }` (`opponent_id` opcional — se omitido, adversário aleatório).

Regras:
- Overall do time = média dos **11 melhores jogadores** do elenco (preferindo titulares, depois overall, depois nome).
- Simulação probabilística: chance de vitória = `clamp(0.50 + dif*0.03, 0.15, 0.85)`; chance de empate = `clamp(0.22 − |dif|*0.01, 0.08, 0.25)`.
- Placar gerado conforme o resultado (vitória: usuário 1–4, oponente menor; derrota: espelhado; empate: 0–3).
- Recompensa apenas em vitória: `round((150 + ovr_oponente*8 + max(0, ovr_oponente − ovr_time)*30)/50) * 50` (sempre múltiplo de 50).

Resposta `DraftPlayResponse`:

```json
{
  "match_id": 1, "user_id": 1, "team_name": "jose", "user_ovr": 71,
  "opponent": { "id": "france", "name": "França", "code": "fr", "overall": 89 },
  "score": { "user": 2, "opponent": 1 },
  "result": "W", "result_label": "Vitória",
  "coins_earned": 900, "new_balance": 15900, "played_at": "..."
}
```

## Administração

| Método | Rota | Descrição |
|---|---|---|
| POST | `/admin/auth/logout` | Encerra a sessão do admin (204) |
| GET | `/admin/metrics/users?month=YYYY-MM` | Métricas de usuários do mês |

`UserMetricsResponse`: `{ "month": "2026-06", "new_users": 5, "mau": 3 }`.

- `new_users`: usuários criados no mês.
- `mau` (Monthly Active Users): usuários distintos com eventos de atividade (`login`) no mês.
- `month` deve seguir o formato `^\d{4}-(0[1-9]|1[0-2])$`.

## Códigos de erro

| Código | Significado |
|---|---|
| 400 | Regra de negócio violada (moedas, posição, carrinho) |
| 401 | Token ausente, inválido ou sessão de admin expirada |
| 404 | Recurso não encontrado |
| 409 | Conflito (duplicidade de username, jogador já possuído) |
| 422 | Validação de schema / formato inválido (ex.: `month`) |

Corpo de erro padrão FastAPI: `{ "detail": "<mensagem>" }`.

## Regras de negócio (resumo)

- **Economia**: usuário novo começa com **15.000 moedas**; preço fixo por faixa de overall.
- **Preços** (`player_pricing.py`):

| overall | preço |
|---|---|
| ≥ 90 | 15.000 |
| ≥ 86 | 10.000 |
| ≥ 82 | 7.000 |
| ≥ 78 | 4.500 |
| ≥ 74 | 2.500 |
| ≥ 70 | 1.200 |
| < 70 | 500 |

- **Posse única**: um jogador pertence a um usuário apenas uma vez (`UNIQUE(user_id, player_id)`).
- **Concorrência**: compras, checkout e partidas bloqueiam a linha do usuário com `FOR UPDATE`; mutações de elenco revalidam o estado pós-update e fazem rollback em anomalias.
