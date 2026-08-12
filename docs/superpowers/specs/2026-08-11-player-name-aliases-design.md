# Player Name Aliases Design

## Objetivo

Complementar a abreviação padrão de nomes de jogadores com nomes conhecidos usados no futebol, evitando resultados pouco naturais como `V. Jose`, `V. Van` e `R. Dias`.

Exemplos obrigatórios:

- `Vinícius Júnior` ou `vinicius jose de oliveira junior` → `Vini Jr.`
- `Raphael Dias Belloli` → `Raphinha`
- `Virgil van Dijk` → `Van Dijk`
- `Rúben Santos Gato Alves Dias` → `Rúben Dias`

Jogadores sem alias continuam seguindo a regra padrão, por exemplo `Lamine Yamal Nasraoui Ebana` → `L. Yamal`.

## Escopo e restrições

- A alteração vale para todas as telas que já usam `formatPlayerName`.
- O mapa de aliases ficará no frontend, sem alterar banco, schema, seed ou contrato da API.
- O nome original continuará sendo usado para busca, filtros e estado interno.
- A lista será curada e baseada nos nomes conhecidos presentes no catálogo atual.
- Aliases serão aplicados antes da abreviação genérica.
- Nomes sem alias, nomes de um termo, entradas vazias e nomes já abreviados manterão o comportamento atual.

## Arquitetura

`frontend-main/js/formatters.js` receberá um mapa `PLAYER_DISPLAY_ALIASES` e uma função interna para normalizar chaves. A normalização removerá acentos, pontuação, diferenças de caixa e espaços repetidos, permitindo que variantes como `Vinícius Júnior` e `vinicius junior` encontrem o mesmo alias.

O fluxo de `formatPlayerName(name)` será:

1. Normalizar espaços e obter a chave de comparação.
2. Retornar o alias curado quando houver correspondência.
3. Caso contrário, aplicar a regra atual de `Inicial. SegundoNome`.

O mapa incluirá os principais aliases do catálogo, como Vini Jr., Raphinha, Van Dijk, Rúben Dias, Casemiro, Marquinhos, Rodri, Gavi, Pedri, Vitinha, Bruno Guimarães, Bruno Fernandes, Bernardo Silva, Rafael Leão, João Neves, João Cancelo, Rúben Neves, Nuno Mendes, Dani Olmo, Nico Williams, David Raya, Fabián Ruiz, Ederson e Bremer.

## Testes e validação

Os testes existentes de `frontend-main/js/formatters.test.js` serão ampliados para cobrir:

- os aliases obrigatórios e suas variantes de acentuação/caixa;
- aliases para nomes completos usados no catálogo;
- preservação da regra padrão para nomes sem alias;
- preservação de entradas vazias, nomes de um termo e nomes já abreviados.

Também serão executados o runner nativo do Node e `node --check` no formatter. Como todas as telas já delegam a exibição ao helper compartilhado, a integração será verificada pelos testes de uso existentes.

## Critério de aceite

Os exemplos obrigatórios aparecem com seus nomes conhecidos em mercado, carrinho, elenco, draft e histórico; nomes não cadastrados no mapa continuam abreviados pela regra geral; e nenhum dado usado para busca ou identificação interna é alterado.
