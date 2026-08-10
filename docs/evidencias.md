# Evidências — Auditoria de Acessibilidade

Ferramenta de auditoria de acessibilidade usada para produzir as evidências da pesquisa (empresas reais). Localizada em `evidencias/`. Combina **Lighthouse** (categoria acessibilidade) e **axe-core** (Playwright) e gera relatórios HTML.

> Projeto Node.js (ES Modules). Dependências: `playwright`, `@axe-core/playwright`, `lighthouse`, `chrome-launcher`, `fs-extra`.

## Uso

```bash
cd evidencias
npm install
node src/index.js https://site.com
```

Um único URL por execução. O programa:

1. Roda **Lighthouse** (Chrome headless) apenas na categoria `accessibility` → pontuação 0–100.
2. Roda **axe-core** (Playwright Chromium, `networkidle` + espera de 5 s) → violações (`id`, `impact`, `description`, quantidade de elementos afetados).
3. Gera o relatório da execução em `output/reports/<timestamp>.html`.
4. Registra o resultado em `output/data.json` (histórico) e regenera o hub `output/index.html`.

## Estrutura

```
evidencias/
├── src/
│   ├── index.js                 # Orquestrador (CLI)
│   ├── service/
│   │   ├── axe.js               # executa axe-core via Playwright
│   │   └── lighthouse.js        # executa Lighthouse (só acessibilidade)
│   ├── utils/
│   │   ├── formatter.js         # helpers de violações e cores por impacto
│   │   └── history.js           # persistência em output/data.json
│   └── report/
│       ├── template.js          # template HTML do relatório
│       ├── generateReport.js    # grava output/reports/<id>.html
│       └── generateHub.js       # grava output/index.html (hub)
└── output/
    ├── data.json                # histórico de execuções
    ├── index.html               # hub com todos os relatórios
    └── reports/<timestamp>.html # relatórios individuais
```

## Saída

- **Relatório individual**: pontuação Lighthouse (círculo + barra; verde > 80, amarelo > 50, vermelho abaixo), resumo de problemas (críticos e sérios), e lista de violações do axe com badge colorido por impacto (critical/red, serious/orange, moderate/yellow, minor/green).
- **Hub**: lista todos os relatórios (URL, pontuação, data) com link para `./reports/<id>.html`.
- **Histórico** (`output/data.json`): array com `{ id, url, report_url, created_at, score }`, mais recentes primeiro.

## Resultados capturados

Resultados atuais em `output/data.json` (maio de 2026):

| URL | Pontuação Lighthouse | Violações axe (principais) |
|---|---|---|
| `https://www.original.com.br/` | 86 | 4 issues: `image-alt` (crítica), `aria-dialog-name` (séria), `color-contrast` (séria), `heading-order` (moderada) |
| `https://www.picpay.com` | 77 | 10 issues: `button-name` e `image-alt` (críticas), `color-contrast`, `link-name` e `scrollable-region-focusable` (sérias), além de landmarks/heading-order/empty-heading |

> Esses resultados são citados na pesquisa acadêmica do `README.md` e em `referencias.md`.

## Observações

- O relatório `output/report.html` e o script `output/report.js` são artefatos antigos de um protótipo e não são produzidos pelo pipeline atual.
- `utils/formatter.js` tem `formatAxe` que não é usado no fluxo atual (a lógica está duplicada em `service/axe.js`).
- `output/` não está no `.gitignore` — os relatórios são versionados.
