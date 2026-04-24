# Stack

## Banco De Dados

- Postgress

## Backend

- FastAPI (Python)
- SQL Alchemy

## FrontEnd

- HTML
- CSS ()
- JS (Vanilla)

---

# pesquisa

# **Implementação de Acessibilidade nas Empresas**

## **PicPay (Grupo J&F)**

- **Política de Acessibilidade:** O site institucional do PicPay *não* exibe uma página dedicada de acessibilidade nem cita explicitamente padrões como WCAG/e-MAG. Há apenas menções genéricas – por exemplo, em seu portal corporativo o PicPay afirma buscar “desenvolver um ambiente acessível e inclusivo para pessoas com deficiência”. Não localizamos compromissos públicos formais além dessa declaração vaga.
- **Recursos Oferecidos:** Na prática, o PicPay oferece alguns serviços de suporte, mas não há evidências de implementação técnica ampla de acessibilidade. Por exemplo, o PicPay disponibiliza atendimento ao cliente em Libras via videoconferência. Em compensação, recursos típicos de acessibilidade digital – como navegação por teclado, leitores de tela integrados, atributos ARIA ou gerenciamento de foco em modais – não são evidenciados ou divulgados no site. Reclamações de usuários apontam dificuldades para pessoas cegas acessarem o aplicativo, indicando que esses recursos não estão adequadamente suportados.
- **Casos Públicos / Processos:** Encontramos uma ação civil pública movida pelo Ministério Público da Bahia em 2025 envolvendo o PicPay. A promotora da Bahia ajuizou ação contra o PicPay (e Banco Original) por “práticas abusivas” em cobranças e atendimento. Essa ação não é especificamente sobre acessibilidade, mas indica falhas de atendimento e transparência da empresa. Não há registro de processos sob a Lei Brasileira de Inclusão (LBI) ou da ADA envolvendo o PicPay até o momento. Em resumo, sem uma política formal, os desenvolvedores do PicPay não parecem obrigados a seguir diretrizes como WCAG, o que pode levar a falhas na experiência para usuários com deficiência.

## **Banco Original (Grupo J&F)**

- **Política de Acessibilidade:** Assim como no PicPay, não identificamos página própria de acessibilidade no site oficial do Banco Original. Sua comunicação pública não destaca compromisso formal com normas de acessibilidade ou LBI. O site destaca apenas a migração de clientes PF para o PicPay (em 2023) e informações comerciais, sem qualquer menção a diretrizes digitais de inclusão.
- **Recursos Oferecidos:** Não há indicações visíveis de recursos técnicos voltados à acessibilidade no site ou aplicativo do Banco Original. Não localizamos recursos de navegação por teclado, leitores de tela ou plugins de acessibilidade. Aparentemente, os produtos digitais do Original seguem o padrão comum de bancos digitais sem adaptações especiais para PCDs. Essa ausência de recursos significa que desenvolvedores não têm suporte institucional para implementar elementos como ARIA ou foco apropriado em modais.
- **Casos Públicos / Processos:** O Banco Original foi citado na mesma ação judicial do MP-BA de 2025 mencionada acima. A promotoria baiana acusa o Original (e o PicPay) de irregularidades em cobrança, redução de crédito e falta de suporte, mas novamente isso trata de práticas de consumo, não de acessibilidade. Não encontramos processos relativos à LBI envolvendo o Original. Sem uma política interna, presume-se que seu desenvolvimento digital não prioriza testes de acessibilidade – uma lacuna que pode ser crítica para usuários com deficiência.

## **Microsoft (Líder Global)**

- **Política de Acessibilidade:** A Microsoft tem política explícita de acessibilidade. Em seu site corporativo de acessibilidade, afirma compromisso com padrões globais: todos os seus produtos e serviços seguem as Diretrizes de Acessibilidade para Conteúdo Web (WCAG), Section 508 dos EUA e o padrão ETSI EN 301 549 da UE. A empresa publica *Accessibility Conformance Reports* (ACRs) – certificados de conformidade – e usa o modelo VPAT para relatar o cumprimento destes padrões. Essa documentação formal dá aos desenvolvedores orientações claras sobre requisitos acessíveis e padrões de teste. A Microsoft também disponibiliza um “Disability Answer Desk” para suporte a clientes com deficiência.
- **Recursos Oferecidos:** Praticamente todos os produtos Microsoft incluem recursos nativos de acessibilidade. Por exemplo, o Windows possui o leitor de telas **Narrator**, modo de alto contraste, legendas automáticas e controles de voz; o Office e o Azure contam com verificação de acessibilidade; o Xbox e navegadores Edge suportam controle por voz e descrição de áudio. A Microsoft incentiva os desenvolvedores a usar esses recursos via documentação e *Insider Labs*. Seu time de qualidade realiza testes automatizados e manuais para WCAG e Section 508. Em resumo, existe forte ênfase técnica (através de APIs e guidelines) para que devs incorporem acessibilidade desde o design inicial.
- **Casos Públicos / Processos:** A Microsoft, por ser líder em acessibilidade corporativa, não é frequentemente alvo de processos por falta de acesso em seus produtos. Ao contrário, seu histórico inclui premiações por inovação inclusiva. Alguns processos ADA clássicos no varejo (por exemplo, restaurantes ou hotéis) não costumam envolver empresas de tecnologia como a Microsoft. Isso reforça que, com políticas sérias, o trabalho do desenvolvedor muda – ele tem regras claras e métricas para atender – e ao seguir essas diretrizes, evita litígios. Não há registros recentes de ações da ADA específicas contra a Microsoft em 2023.

## **Magazine Luiza (Mercado Brasileiro)**

- **Política de Acessibilidade:** O Magazine Luiza demonstra compromisso público. Em seu site de Relações com Investidores, há uma página dedicada à acessibilidade que afirma ter desenvolvido o novo site seguindo padrões do W3C (WCAG). Nela consta que o conteúdo foi adaptado para ser claro, testado com leitores de tela populares (JAWS, NVDA, etc.) e navegadores diversos. Isso indica diretrizes internas e adesão a padrões formais (e-MAG / WCAG). Esse é um exemplo de política explícita – o que exige dos desenvolvedores documentar os requisitos de acessibilidade no projeto.
- **Recursos Oferecidos:** O e-commerce do Magalu oferece várias facilidades: há um conjunto de ferramentas ativáveis de acessibilidade (plugin *Essential Accessibility*), além de atendimento em Libras via videochamada (“Pessoalize”) e tradução em tempo real para Libras (*Hand Talk*). O site também informa sobre navegação por teclado e opções de zoom. No nível técnico, espera-se que o sistema tenha implementado atributos ARIA e gerenciamento de foco, embora não tenhamos acesso ao código-fonte. A política pública e as ações (plugins, libras) sugerem que o Magalu capacita seus desenvolvedores a integrar essas tecnologias assistivas.
- **Casos Públicos / Processos:** Não há notícia de processos contra o Magazine Luiza especificamente por acessibilidade digital. No entanto, estudos independentes confirmam desafios: por exemplo, o NIC.br (2018) avaliou os sites de e-commerce mais visitados (entre os quais Magazine Luiza) e constatou “extrema dificuldade” de navegação para PCDs, além de identificar “violações graves” do CDC e da LBI. Embora seja anterior à LBI, esse levantamento indica que o Magalu ainda enfrenta barreiras práticas. Pelo menos há consciência pública, e nenhum caso judicial recente de multa por acessibilidade entrou em evidência. A existência de uma política séria faz os devs trabalharem alinhados às normas – no Magalu, isso significa usar ferramentas dedicadas e testes regulares; sem ela, como mostram outros varejistas, muitos detalhes (como descrições de imagem adequadas) acabariam esquecidos.

**Fontes:** Relatórios e sites oficiais das empresas e veículos de imprensa especializados foram consultados para validar cada ponto (por exemplo, página institucional do PicPay, documentos Microsoft de acessibilidade, divulgação de acessibilidade da Magazine Luiza e estudos setoriais sobre barreiras digitais). Cada afirmação acima baseia-se em evidências disponíveis publicamente.






# Responsaveis

• Prototipação UI/UX no Figma

Bibia

• Desenvolvimento do Frontend (JS Vanilla e implementação de A11y).

Lui

• Desenvolvimento do Backend e modelagem do Banco de Dados.

Rodrigo

Kluska

Chris

• Documentação contínua.

Kluska
