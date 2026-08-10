# Ultimate Team da Copa do Mundo — Frontend

Interface web do simulador de seleções da Copa do Mundo.

## Stack
- HTML + CSS + JavaScript (Vanilla)
- Servido via Nginx
- Deploy no Render via Docker

## Estrutura

```
Dream Team-frontend/
├── index.html       # Landing Page
├── auth.html        # Login / Cadastro
├── market.html      # Mercado da Bola (home pós-login)
├── squad.html       # Meu Elenco
├── draft.html       # Tela de Jogar (Draft)
├── css/
│   ├── global.css   # Variáveis, reset e utilitários globais
│   ├── landing.css
│   ├── auth.css
│   ├── market.css
│   ├── squad.css
│   └── draft.css
└── js/
    ├── api.js       # Todas as chamadas à API (ponto central)
    ├── auth.js      # Login, cadastro, sessão e guard de rotas
    ├── navbar.js    # Componente de navbar compartilhada
    ├── market.js
    ├── squad.js
    └── draft.js
```

## Como rodar localmente

```bash
docker build -t frontend .
docker run -p 3000:80 frontend
```

Acesse `http://localhost:3000`.
