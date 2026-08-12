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

As funções de fingerprint compartilhadas ficam em `pipeline/fingerprints.py` (constantes da origem, `build_squads_fingerprint`, `fill_missing_inputs_fingerprint` e `current_pipeline_state`).

## Verificação de pipeline — `database/verify_pipeline.py`

No deploy (Render free tier), o filesystem é **efêmero** — o cache local não sobrevive entre builds. Para não repetir o pipeline caro a cada build, os fingerprints aplicados são persistidos no banco (tabela `pipeline_state`):

1. O entrypoint roda `python -m database.verify_pipeline`.
2. Ele busca os elencos do openfootball (1 requisição), computa os fingerprints atuais e compara com a tabela `pipeline_state`.
3. **Iguais** → exit 0: pula o pipeline e o seed, subindo direto a app.
4. **Diferentes** (ou tabela vazia, ex. primeiro deploy) → exit 1: roda `run.py` e depois `database/seed_players.py`, que registra os novos fingerprints **somente após o seed ter sucesso** (`record_pipeline_state` em `seed_players.py`).
5. Se o openfootball estiver indisponível, o verify **assume dados inalterados** e pula o pipeline.

O cache local continua útil para desenvolvimento local e para a trilha de atualização (dados mudaram), mas a persistência entre builds é garantida pelo banco.

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
