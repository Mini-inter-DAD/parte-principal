# Arquitetura

Visão geral de como as partes do projeto se conectam.

## Visão geral

O projeto é dividido em três aplicações principais — **backend**, **frontend** e **pipeline de dados** — além do banco de dados e da ferramenta de auditoria de acessibilidade.

```
                        ┌──────────────────────────────┐
                        │        FRONTEND (Nginx)       │
                        │  HTML + CSS + JS (Vanilla)    │
                        │  index, auth, market, squad,  │
                        │  draft + widget de a11y       │
                        └──────────────┬───────────────┘
                                       │ HTTP/JSON (fetch)
                                       │ Authorization: Bearer <token>
                                       ▼
                        ┌──────────────────────────────┐
                        │        BACKEND (FastAPI)     │
                        │  routes/  →  services/       │
                        │  repositories/  →  schemas/  │
                        └──────────────┬───────────────┘
                                       │ SQLAlchemy Core (SQL puro)
                                       ▼
                        ┌──────────────────────────────┐
                        │   PostgreSQL 17 (Docker)      │
                        │   database/schema.sql         │
                        └──────────────────────────────┘

   ┌─────────────── PIPELINE DE DADOS ───────────────┐
   │  openfootball (elencos WC 2026)  ──┐            │
   │  EA FC 26 (CSV: stats)        ────┤            │
   │  Futwiz CDN (fotos)           ────┼──► players.json ──► seed_players.py ──► DB
   │  Groq/LLM (overalls ausentes) ────┘            │
   │  data/cache (fingerprint)                     │
   └────────────────────────────────────────────────┘

   ┌─────────── EVIDENCIAS (auditoria de a11y) ───────────┐
   │  node src/index.js <url>  →  Lighthouse + axe-core    │
   │  →  output/reports/<id>.html  +  output/index.html     │
   └───────────────────────────────────────────────────────┘
```

## Backend (FastAPI)

Camadas em `backend/`:

- **routes/** — roteadores FastAPI (`players`, `market`, `users`, `squad`, `cart`, `draft`, `admin`). Convertem erros de serviço em códigos HTTP.
- **services/** — regras de negócio: autenticação, compra, carrinho, escalação, simulação de partida, métricas, precificação.
- **repositories/** — acesso ao banco com SQL puro via SQLAlchemy Core (`text()`). Sem ORM mapeando tabelas.
- **schemas/** — modelos Pydantic de entrada/saída das rotas.
- `app.py` — cria a aplicação, habilita CORS aberto (`*`) e registra os roteadores.

Fluxo de uma requisição:

```
HTTP → routes/ → services/ (valida regras) → repositories/ (SQL) → PostgreSQL
```

## Frontend

Frontend vanilla em `frontend-main/`, servido por Nginx no Docker. A comunicação com o backend é centralizada em `js/api.js` (`fetch`), com token lido do `localStorage`. O endereço do backend é `http://localhost:8000` por padrão e pode ser sobrescrito com o parâmetro `?api=`. Detalhes em [`frontend.md`](frontend.md).

## Pipeline de dados

Orquestrado por `run.py`, com etapas em `pipeline/` e cache com fingerprint em `data/cache`. O resultado final `output/players.json` alimenta o seed do banco. Detalhes em [`pipeline.md`](pipeline.md).

## Estrutura do repositório

```
mini-inter/
├── .env.example            # Variáveis de ambiente de exemplo
├── README.md               # Índice do projeto + pesquisa acadêmica
├── referencias.md          # Referências bibliográficas da pesquisa
├── requirements.txt        # Dependências Python
├── docker-compose.yml      # PostgreSQL 17
├── run.py                  # Orquestrador do pipeline
│
├── backend/                # API FastAPI
│   ├── app.py
│   ├── routes/             # Roteadores HTTP
│   ├── services/           # Regras de negócio
│   ├── repositories/       # SQL (SQLAlchemy Core)
│   └── schemas/            # Modelos Pydantic
│
├── frontend-main/          # Interface web (vanilla)
│   ├── index.html          # Landing page
│   ├── auth.html           # Login / Cadastro
│   ├── market.html         # Mercado (home pós-login)
│   ├── squad.html          # Meu Elenco
│   ├── draft.html          # Jogar (draft)
│   ├── css/                # 7 folhas de estilo (global + por página)
│   ├── js/                 # api, auth, market, squad, draft, a11y...
│   └── Dockerfile          # Servir via Nginx
│
├── database/               # Banco
│   ├── schema.sql          # DDL completo
│   ├── connection.py       # Engine e sessão SQLAlchemy
│   ├── seed_players.py     # Popula a tabela players
│   └── admin_username_migration.sql
│
├── pipeline/               # Pipeline de dados
│   ├── build_squads.py     # Elencos + EA FC + fotos
│   ├── fill_missing.py     # IA para overalls ausentes
│   ├── cache.py            # Cache por fingerprint
│   ├── source/             # FIFA source e fotos
│   └── utils.py
│
├── metrics/
│   └── summer_squads.py    # Resumo de cobertura por seleção
│
├── models/
│   └── player.py           # Modelo Pydantic de jogador (pipeline)
│
├── data/                   # CSVs, JSONs e cache do pipeline
├── output/                 # Resultado do pipeline (players.json)
├── artifacts/              # Artefatos (players.json de backup)
│
└── evidencias/             # Auditoria de acessibilidade
    ├── src/                # Lighthouse + axe-core + relatórios
    └── output/             # Relatórios HTML gerados
```
