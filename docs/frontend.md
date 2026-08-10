# Frontend

Interface web "Ultimate Team da Copa do Mundo" em HTML + CSS + JavaScript (Vanilla), servida por Nginx (Docker) e publicada no Render. Pasta: `frontend-main/`.

## Fluxo de navegação

```
index.html (landing)
   └─ se já logado → redireciona para market.html (index.js)
auth.html (login / cadastro / esqueci a senha)
   └─ sucesso → saveSession() → market.html
market.html (Mercado — home pós-login)
   └─ navbar: Mercado | Meu Elenco | Jogar | Sair (com saldo de moedas)
squad.html (Meu Elenco — escalação no campo)
draft.html (Jogar — partidas)
```

## Páginas

| Arquivo | Descrição |
|---|---|
| `index.html` | Landing page: hero, mockups de cartas, CTAs para `auth.html` |
| `auth.html` | Card único com três abas (login, cadastro, esqueci a senha) + botão "Entrar com Demo" |
| `market.html` | Mercado: filtros, grade de jogadores, paginação, carrinho lateral |
| `squad.html` | Escalação: seletor de formação, campo interativo, lista de titulares/reservas |
| `draft.html` | Partida: prévia do confronto, transmissão animada, resultado e histórico |

## Arquivos JS

| Arquivo | Responsabilidade |
|---|---|
| `js/api.js` | Ponto central de comunicação com o backend (todos os `fetch`) |
| `js/auth.js` | Sessão no `localStorage` (`token`, `user`), login/logout, guards e modo demo |
| `js/navbar.js` | Componente de navbar compartilhada (links, moedas, sair) |
| `js/market.js` | Lógica do mercado: filtros client-side, paginação, carrinho |
| `js/squad.js` | Escalação: formações, atribuição de posições, banco de reservas |
| `js/draft.js` | Máquina de estados da partida (preview → live → resultado), histórico |
| `js/accessibility.js` | Widget de acessibilidade (tema, tamanho de fonte, leitura de tela) |
| `js/notify.js` | Notificações/toasts baseadas em SweetAlert2 |
| `js/formatters.js` | Formatação de posições e rótulos em português |
| `js/index.js` | Redirecionamento da landing para usuários logados |

## Arquivos CSS

`css/global.css` (variáveis, reset e utilitários), `accessibility.css`, `landing.css`, `auth.css`, `market.css`, `squad.css`, `draft.css`. O tema claro/escuro é controlado pelo atributo `data-theme` no `<html>` e sobrescreve as variáveis globais.

## Comunicação com o backend

- **URL da API**: `http://localhost:8000` por padrão; sobrescrita pelo parâmetro `?api=<url>` em qualquer página.
- **Autenticação**: token e usuário no `localStorage`. Toda chamada via `apiFetch` envia `Authorization: Bearer <token>`.
- **401**: `apiFetch` limpa a sessão e redireciona para `auth.html`.
- **Modo demo**: quando o token não começa com `user:` (ex.: `demo-token`), as chamadas de carrinho/compra são desativadas e o saldo é mantido localmente.

Endpoints usados pelo frontend:

| Método | Rota | Uso |
|---|---|---|
| POST | `/auth/register` | Cadastro |
| POST | `/auth/login` | Login |
| GET | `/market/players` | Catálogo do mercado |
| GET | `/market/sections` | Seções do mercado |
| GET | `/cart/{userId}` | Carrinho |
| POST | `/cart/add` | Adicionar ao carrinho |
| DELETE | `/cart/remove` | Remover do carrinho |
| DELETE | `/cart/clear/{userId}` | Limpar carrinho |
| POST | `/cart/checkout` | Finalizar compra |
| GET | `/squad/{userId}` | Elenco do usuário |
| PATCH | `/squad/assign-position` | Escalar jogador em posição |
| PATCH | `/squad/move-to-bench` | Mover para o banco |
| GET | `/draft/opponents` | Adversários |
| POST | `/draft/play` | Jogar partida |
| GET | `/draft/history/{userId}` | Histórico |

## Acessibilidade

O widget de acessibilidade é injetado em todas as páginas por `js/accessibility.js` (inicializado com `initAccessibility()`):

1. **Tema claro/escuro** — botão com `aria-label`/`title` dinâmicos; preferência persistida no `localStorage` (`utcm_theme`).
2. **Controle de tamanho de fonte** — intervalo 12–22 px (padrão 16), persistido (`utcm_fontSize`), aplicado via `font-size` no `<html>` (layout em `rem`); botões desabilitados nos limites e indicador `aria-live`.
3. **Leitura de tela (text-to-speech)** — Web Speech API (`SpeechSynthesisUtterance`, `lang pt-BR`); oculta o próprio widget e lê o conteúdo do `<main>`; grupo fica oculto se a API não for suportada; estado `aria-pressed` no botão.

Comportamento do widget: painel com `role="group"`, fecha com `Escape` (devolvendo o foco ao botão), fecha ao clicar fora, e para a leitura ao fechar.

Outros recursos de acessibilidade no app:

- **Foco e teclado**: `focus-visible` (contorno de 3 px) no widget; itens do elenco usam `role="button"` + `tabindex="0"` com ativação por Enter/Espaço e `aria-pressed`; botões de formação com `aria-pressed`; abas de autenticação com `role="tablist/tab/tabpanel"`.
- **Live regions**: `#draft-status` e `#match-events` (`role="status"`/`role="log"`, `aria-live="polite"`), toasts com `aria-live="polite"`.
- **`inert`**: campos de filtro do mercado recebem `inert` quando o painel está recolhido.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` desativa animações do widget.
- **Imagens**: `loading="lazy"`, `alt` significativo, `onerror` com fallback para iniciais, ícones decorativos com `aria-hidden="true"`.

### Limitações conhecidas

- Não há **skip links** nas páginas (cada página tem `<main id="main-content">`, mas nenhum link pula até ele).
- Não há modo de **alto contraste** dedicado (apenas tema claro/escuro e contornos de foco).
- `{css,js}/auth-ui.js` fica em uma pasta com nome literalmente entre chaves (artefato de copiar/colar) e contém o código **duplicado** (um guard faz só a primeira cópia executar).
- `api.forgotPassword` é referenciada em `auth-ui.js` mas **não existe** em `api.js` — o fluxo "Esqueci minha senha" não conclui no MVP (o backend também responde como não disponível).
- Métodos definidos em `api.js` mas sem uso atual: `buyPlayer`, `substitute`, `updateStarter`, `setStarter`.
