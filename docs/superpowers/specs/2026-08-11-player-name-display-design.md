# Player Name Display Abbreviation Design

## Objetivo

Exibir nomes de jogadores de forma compacta em todas as telas do frontend, usando a primeira letra do primeiro termo seguida de ponto e do segundo termo.

Exemplos:

- `Kyllian Mbappe` → `K. Mbappe`
- `Lamine Yamal Nasraoui Ebana` → `L. Yamal`

## Escopo e restrições

- A mudança vale para mercado, carrinho, elenco, campo, draft e histórico.
- A API, a busca e os objetos internos continuam usando o nome completo.
- Nomes com apenas um termo permanecem inalterados.
- Espaços repetidos ou nas extremidades são normalizados.
- Entradas vazias, nulas ou indefinidas não podem causar erro de renderização.
- Não haverá alteração de banco de dados nem de contrato das respostas da API.

## Arquitetura

A função compartilhada `formatPlayerName(name)` será implementada em `frontend-main/js/formatters.js`, que já é carregado pelas telas relevantes.

O helper será a única fonte de verdade do frontend para a abreviação. A função duplicada atualmente existente em `frontend-main/js/market.js` será removida.

Os pontos de renderização serão ajustados para usar o helper:

- cards do mercado e itens do carrinho;
- nomes do campo, titulares e reservas do elenco;
- títulos e descrições visíveis que exibem jogadores no draft;
- gols e eventos do histórico do draft, inclusive nomes completos de partidas antigas.

O valor original continuará disponível para filtros, buscas, `alt` de imagens e identificadores técnicos quando isso for mais apropriado para acessibilidade e depuração.

## Regra de formatação

1. Converter a entrada para texto e remover espaços excedentes.
2. Se não houver termos, retornar texto vazio.
3. Se houver apenas um termo, retornar o termo normalizado.
4. Se houver dois ou mais termos, retornar `${primeiro[0]}. ${segundo}`.
5. Se o nome já estiver no formato abreviado, preservar o resultado sem criar uma segunda abreviação incorreta.

## Testes e validação

Serão adicionados testes automatizados para a função compartilhada cobrindo:

- nomes com dois termos;
- nomes com múltiplos sobrenomes;
- nomes de um único termo;
- espaços excedentes;
- entrada vazia ou ausente;
- nomes já abreviados.

Também será feita uma busca estática nos scripts para confirmar que as áreas de exibição não continuam atribuindo diretamente nomes completos aos elementos visíveis. A validação final deverá confirmar que os testes passam e que não há alteração na lógica de busca ou filtragem.

## Critério de aceite

Em todas as telas citadas, um jogador com pelo menos dois termos no nome aparece visualmente como `Inicial. SegundoNome`; nomes de um termo continuam legíveis; buscas e dados internos continuam recebendo o nome completo; e os testes automatizados passam sem erros.
