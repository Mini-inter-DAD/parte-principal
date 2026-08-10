# Pipeline de Dados

Pipeline que monta o catálogo de jogadores da Copa do Mundo 2026. Orquestrado por `run.py` e executado em três etapas:

```
1/3  build_squads   → output/players.json (elencos completos)
2/3  fill_missing   → output/players.json (overalls estimados por IA)
3/3  summer_squads  → métricas de cobertura por seleção
```

```bash
python run.py
```

## Etapa 1 — `pipeline/build_squads.py`

1. Baixa os elencos das seleções da Copa 2026 do **openfootball**: `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.squads.json`.
2. Carrega o CSV da **EA FC 26** (`data/ea_fc26_players.csv`) com `pipeline/source/fifa_source.py`, montando objetos `models/player.py` (id, nome, overall, posição, nacionalidade, clube).
3. **Corresponde jogadores** por nome: normalização (minúsculas, sem acentos/pontuação) e variantes (nome completo, primeiro+último). Jogadores não encontrados vão para a lista `missing` (exibida no console).
4. **Busca fotos** em paralelo (20 threads) via `pipeline/source/photo_source.py` (CDN da Futwiz, `https://cdn.futwiz.com/assets/img/fc26/faces/<ea_id>.png`), com fallback para `None`.
5. Grava `output/players.json`.

Cada entrada tem: `nation`, `wc_name`, `ea_id` (ou `null`), `name`, `common_name`, `overall`, `position` (posição da convocação), `nationality`, `club`, `photo`.

## Etapa 2 — `pipeline/fill_missing.py`

Para os jogadores ausentes do CSV da EA (lidos de `data/missing.json`), estima o **overall** com a API da **Groq** (modelo `llama-3.3-70b-versatile`, temperatura 0.1):

- Entrada: lotes de 10 jogadores (`nome | posição | seleção`).
- Prompt de sistema: retornar apenas um JSON com os overalls estimados (55–91), com base em reputação real, nível da liga e desempenho.
- Falha de um lote: fallback para overall **70** (o batch continua).
- Resultado é anexado a `output/players.json` com `ea_id: null`, `club: "Unknown"`, nome em minúsculas.
- Requer `GROQ_API_KEY` no ambiente.

## Cache — `pipeline/cache.py`

Cache por **fingerprint** (SHA-256) para evitar recomputo:

- `build_squads`: fingerprint = hash(JSON dos elencos + conteúdo do CSV da EA + versão).
- `fill_missing`: fingerprint = hash(missing.json + players.json + prompt do sistema + modelo + temperatura).

Arquivos: `data/cache/manifest.json` (fingerprints) e `data/cache/<step>.json` (resultados). Bypass com a variável de ambiente `PIPELINE_NO_CACHE` (qualquer valor que não seja vazio/`0`/`false`).

## Etapa 3 — `metrics/summer_squads.py`

Lê `output/players.json` e imprime, por seleção, o total de convocados (padrão **26** por seleção), ausentes, % de cobertura e uma barra visual.

```
Seleção                        Encontrados    Ausentes  Cobertura
-------------------------------------------------------------
Argentina                              26           0       100%  █████████████
...
```

## Saída e uso

`output/players.json` é consumido pelo `database/seed_players.py` para popular a tabela `players` (ver [`banco-de-dados.md`](banco-de-dados.md)). Há uma cópia de backup em `artifacts/players.json`, usada como fallback se `output/` não existir.
