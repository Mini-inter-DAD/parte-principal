# Configuração e Execução

Guia para preparar o ambiente e rodar cada parte do projeto.

## Requisitos

- Python 3.10+
- Docker e Docker Compose
- Node.js 18+ (necessário apenas para a ferramenta de auditoria em [`evidencias.md`](evidencias.md))
- Acesso à internet (download de dados dos elencos, fotos e chamadas de IA)

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Descrição | Exemplo |
|---|---|---|
| `FOOTBALL_API_KEY` | Chave de API de dados de futebol (não usada no código atual — mantida do escopo original) | `YOUR_API_KEY` |
| `GROQ_API_KEY` | Chave da API da Groq, usada no pipeline para estimar overall de jogadores ausentes | `YOUR_API_KEY` |
| `DATABASE_URL` | URL de conexão SQLAlchemy com o PostgreSQL | `postgresql://admin:admin@localhost:5432/dreamcup` |
| `POSTGRES_DB` | Nome do banco no contêiner Docker | `dreamcup` |
| `POSTGRES_USER` | Usuário do banco no contêiner Docker | `admin` |
| `POSTGRES_PASSWORD` | Senha do banco no contêiner Docker | `admin` |

## 1. Banco de dados

Subir o PostgreSQL 17:

```bash
docker compose up -d
```

Aplicar o schema:

```bash
psql -h localhost -U admin -d dreamcup -f database/schema.sql
```

> O schema também pode ser aplicado via `docker exec -i dreamcup-db psql -U admin -d dreamcup < database/schema.sql`.

### Povoar o banco

1. Execute o pipeline de dados para gerar `output/players.json` (ver [`pipeline.md`](pipeline.md)) — ou reutilize o arquivo existente em `artifacts/players.json`.
2. Rode o seed dos jogadores:

```bash
python -m database.seed_players
```

O seed lê `output/players.json` (ou `artifacts/players.json` como fallback), cruza as posições com o CSV da EA FC (`data/ea_fc26_players.csv`), calcula o preço de cada jogador e insere/atualiza a tabela `players`.

### Criar um administrador

Para acesso ao painel administrativo (login unificado e métricas), crie um admin. Há um exemplo de migração em `database/admin_username_migration.sql`.

## 2. Backend (FastAPI)

```bash
pip install -r requirements.txt
uvicorn backend.app:app --reload
```

- API disponível em `http://localhost:8000` (endpoints prefixados com `/api`)
- Frontend servido pelo backend em `http://localhost:8000`
- Documentação interativa (Swagger): `http://localhost:8000/docs`
- Health check: `GET http://localhost:8000/api/health`

### Autenticação

- **Usuário**: token é o próprio id (`user:<id>`), via `Authorization: Bearer user:<id>`.
- **Administrador**: sessão com token aleatório de 32 bytes, válida por 8 horas, armazenado como hash SHA-256.

Veja [`backend.md`](backend.md) para a referência completa da API.

## 3. Frontend

O frontend é HTML/CSS/JS puro servido por Nginx (Docker):

```bash
cd frontend-main
docker build -t frontend .
docker run -p 3000:80 frontend
```

Acesse `http://localhost:3000`.

Para rodar em desenvolvimento sem Docker, sirva a pasta `frontend-main` estaticamente (ex.: `python -m http.server 3000` dentro da pasta) e informe a URL do backend via parâmetro `?api=`:

```
http://localhost:3000/market.html?api=http://localhost:8000
```

## 4. Pipeline de dados

```bash
python run.py
```

Orquestra as três etapas: construir elencos, preencher ausentes com IA e exibir métricas finais. Detalhes em [`pipeline.md`](pipeline.md).

## 5. Auditoria de acessibilidade (evidencias)

```bash
cd evidencias
npm install
node src/index.js https://site.com
```

Gera relatórios HTML com Lighthouse (categoria acessibilidade) e axe-core. Veja [`evidencias.md`](evidencias.md).
