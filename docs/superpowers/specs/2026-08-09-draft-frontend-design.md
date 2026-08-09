# Draft Frontend — Design Specification

## Goal

Atualizar exclusivamente a experiência frontend da tela de Draft para suportar os modos Copa do Mundo e Amistoso em cards recolhíveis, partidas ao vivo com eventos de gol, histórico expansível, bloqueio sem 11 titulares, OVR visível e atualização reativa de saldo.

## Boundaries

- Nenhum arquivo em `backend/`, `database/`, `models/` ou serviços de API será alterado.
- O backend atual continua sendo a fonte oficial de resultado, placar, OVR retornado, recompensa, saldo e histórico persistido.
- O frontend poderá exibir dados demonstrativos de eventos de gol somente quando a resposta atual não os fornecer; essa camada será substituível por dados da API.
- A Copa terá oito etapas visuais: três jogos de fase de grupos, 16 avos, oitavas, quartas, semifinal e final. Não haverá tabela, classificação, pontos, saldo de gols ou chaveamento.

## Architecture

`draft.js` permanece como orquestrador do ciclo da tela e mantém um estado único para modo, etapa, partida, elenco, eventos, histórico e saldo. A apresentação será separada em módulos frontend pequenos, carregados antes do orquestrador: um módulo de contrato/adaptação de dados, um de eventos de partida e um de histórico. Esses módulos não chamarão a API diretamente; receberão dados normalizados e devolverão/renderizarão estruturas que possam ser alimentadas pela API real.

O fluxo será:

```text
api.getSquad / api.getOpponents / api.playDraft / api.getHistory
                         ↓
              estado normalizado do Draft
                         ↓
      modos · preview · partida · resultado · histórico
                         ↓
         session/localStorage · navbar reativa
```

## Data contracts

O frontend usará objetos compatíveis com as respostas atuais e aceitará os campos opcionais abaixo:

```js
/** @typedef {'USER'|'OPPONENT'} GoalTeam */

/**
 * @typedef {Object} GoalEvent
 * @property {number|null} minute
 * @property {string|null} playerId
 * @property {string} playerName
 * @property {string|null} position
 * @property {GoalTeam} team
 */

/**
 * @typedef {Object} DraftPhase
 * @property {string} id
 * @property {string} label
 * @property {number} index
 * @property {number} total
 */
```

Uma resposta futura poderá fornecer `goal_events` na partida e no histórico. Ausentes, os campos serão tratados como lista vazia; o fallback visual será limitado à demonstração da interface e terá indicação de integração futura no código.

## UI behavior

### Mode cards

- Copa do Mundo aparece antes de Amistoso.
- Os dois cards começam fechados, com `aria-expanded="false"`.
- O cabeçalho alterna abertura, fecha ao segundo clique e exibe chevron animado.
- Somente o conteúdo do card ativo alimenta o preview; o fluxo de partida é compartilhado.
- A Copa mostra a fase atual de modo discreto e continua no fluxo “jogar partida → resultado → próxima”.

### Match and goals

- Antes do início, o botão fica desabilitado quando não existem exatamente 11 titulares válidos (`is_starter === true` e `squad_position` preenchida).
- O estado incompleto mostra contagem e mensagem explicativa.
- A partida renderiza eventos à medida que o relógio avança, com minuto quando disponível, ícone de gol, autor e time.
- A prioridade de probabilidade de gol não será implementada no frontend; a autoria oficial pertence à simulação do backend.

### OVR and balance

- O OVR de preview será calculado pela média dos titulares válidos usando os campos `overall`/`ovr`, alinhado ao cálculo já exibido em `squad.js`.
- O OVR e saldo retornados pelo backend têm precedência no resultado da partida.
- Após `api.playDraft`, `setUserCoins(new_balance)` atualiza a sessão e o header; não será usado `window.location.reload()`.

### History

- Cada partida permanece compacta fechada.
- Clique no card ou no botão de detalhes alterna um painel interno com gols.
- Histórico atual sem autores/minutos continua renderizável, exibindo estado vazio orientado à integração sem inventar dados persistentes.

## Error handling and accessibility

- Falhas de API continuam passando por `notify.error`/status acessível.
- Botões terão `type`, foco visível, `aria-controls` e `aria-expanded` coerentes.
- Eventos ao vivo serão anunciados no `role="log"` existente.
- O layout continuará responsivo em telas estreitas, com cards e scoreboard empilháveis.

## Testing and validation

- Criar testes frontend mínimos para normalização de titulares/OVR, fases da Copa, normalização de eventos e abertura/fechamento dos detalhes quando o ambiente de testes existente permitir.
- Validar sintaxe de todos os scripts com Node ou ferramenta disponível.
- Executar testes, lint e build existentes; se não houver scripts frontend, registrar isso explicitamente.
- Conferir `git diff --check`, `git status` e assegurar que nenhum caminho fora de `frontend-main/` seja alterado pelo código da feature.

## Backend follow-up contract

Para completar a experiência sem fallback, o backend deverá fornecer eventos em partida e histórico, fase/campanha persistida da Copa e validação de segurança dos 11 titulares. O contrato mínimo de evento é:

```ts
interface GoalEvent {
  playerId: string;
  playerName: string;
  minute: number;
  position?: string;
  team: 'USER' | 'OPPONENT';
}
```
