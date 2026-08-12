# Layout responsivo dos nomes no campo

## Objetivo

Impedir que nomes de jogadores se sobreponham no campo da tela de elenco, mantendo a leitura rápida e sem alterar seleção, troca de jogadores, formações, busca ou dados internos.

## Comportamento aprovado

- Cada rótulo de jogador terá uma largura máxima calculada a partir do espaço disponível até os jogadores vizinhos da mesma linha da formação.
- O nome poderá ocupar até duas linhas no campo.
- Nomes com exatamente dois termos serão exibidos preferencialmente em duas linhas quando o espaço horizontal for insuficiente, por exemplo `DAYOT` / `UPAMECANO`.
- Nomes que ainda não couberem após a quebra serão truncados com reticências.
- O nome completo continuará disponível no atributo `title` para mouse e tecnologias que expõem a descrição nativa do elemento.
- O comportamento será recalculado quando a largura do campo mudar, incluindo redimensionamento da janela.
- Nomes vazios continuarão usando o rótulo da posição nos slots vazios.

## Abordagens consideradas

1. Apenas CSS com quebra de linha: tem baixo custo, mas não conhece a distância entre slots e pode falhar em formações compactas.
2. Reposicionamento automático dos nomes: evita parte das colisões, mas pode separar visualmente o nome do jogador correspondente.
3. Solução híbrida escolhida: o JavaScript calcula a largura segura com base na formação e o CSS controla quebra, limite de linhas e reticências. Isso preserva o alinhamento e se adapta a diferentes tamanhos de tela.

## Arquitetura e fluxo

`renderField()` continuará criando um rótulo por slot. Após a renderização, uma função de layout calculará a distância horizontal até o slot mais próximo da mesma linha e gravará o valor em uma propriedade CSS customizada no slot. O CSS usará essa propriedade como `max-width` do nome, com uma largura mínima segura para manter a leitura.

O texto será mantido normalizado pelo formatador compartilhado existente. O valor completo será usado no `title`, enquanto o texto visível continuará sendo o nome de apresentação atual.

Um listener de `resize` acionará apenas o recálculo de larguras, sem reconstruir o estado da escalação. A rotina deverá ser tolerante à ausência do campo para não interferir em testes ou outras telas.

## Estilos

- `white-space` deixará de forçar uma linha única.
- O rótulo terá altura de até duas linhas, `overflow: hidden` e truncamento compatível com múltiplas linhas.
- A largura máxima ficará limitada tanto pela distância aos vizinhos quanto pelo limite visual atual.
- A tipografia, o contraste, o `text-shadow`, o cursor e os estados de seleção permanecerão inalterados.

## Testes e validação

- Adicionar testes unitários para a função pura que calcula a largura segura entre slots, cobrindo slots isolados, vizinhos próximos e limites mínimos/máximos.
- Verificar que a renderização mantém `title` com o nome completo.
- Executar os testes JavaScript existentes e verificações de sintaxe dos scripts alterados.
- Fazer inspeção visual em uma formação com nomes longos e em uma largura de viewport menor, confirmando ausência de sobreposição e preservação das interações.

## Fora de escopo

- Alterar o contrato da API ou os nomes armazenados.
- Alterar a lista lateral do elenco, o mercado, o draft ou a lógica de seleção.
- Reposicionar tokens, trocar formações ou adicionar novos controles ao usuário.
