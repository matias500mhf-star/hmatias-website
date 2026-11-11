# HMATIAS — Mapa de dependências das páginas

**Data:** 11 de novembro de 2026  
**Branch:** `feat/hmatias-platform-modernization-20261111`  
**Referência:** inventário automático de 51 ficheiros HTML do repositório.

## 1. Resultado geral

O mapeador encontrou **36 folhas de estilo distintas** e **29 referências de scripts distintas** declaradas diretamente no HTML. A contagem representa o número de páginas HTML que referenciam cada ficheiro, não o número de tags ou o número de vezes que um script é executado.

### CSS mais partilhado

| Ficheiro | Páginas que o referenciam |
|---|---:|
| `header.css` | 28 |
| `premium-typography.css` | 28 |
| `typography.css` | 28 |
| `institutional-premium.css` | 26 |
| `style.css` | 24 |
| `premium.css` | 22 |
| `assistant.css` | 20 |
| `division.css` | 16 |
| `site-review.css` | 16 |
| `source-ao/sourceao.css` | 7 |
| `site-improvements.css` | 6 |

As folhas de estilo institucionais são partilhadas por muitas páginas. Uma alteração em cabeçalho, tipografia, tokens ou estilos de divisão pode, por isso, produzir efeitos laterais em várias áreas do website.

### Scripts mais partilhados

| Script | Páginas que o referenciam |
|---|---:|
| Cookiebot `uc.js` | 49 |
| `tag-manager.js` | 49 |
| `analytics.js` | 40 |
| `script.js` | 28 |
| `assistant-api-bridge.js` | 26 |
| `assistant.js` | 26 |
| `source-ao/runtime-config.js` | 11 |
| `website-lead-client.js` | 8 |
| `product-photo-fallback.js` | 4 |
| `site-bootstrap.js` | 4 |

A camada de consentimento e analytics está amplamente distribuída. A ordem de carregamento e os atributos de consentimento têm de ser preservados durante qualquer reorganização.

## 2. Composição observada

### Homepage

A homepage utiliza bundles gerados:

- `home-base.css` é composto a partir de `style.css` e `typography.css`.
- `home-details.css` é composto a partir de `assistant.css`, `karta-access.css`, `brand-lock.css` e `premium-editorial.css`.

O gerador `scripts/build-home-css.mjs` usa Lightning CSS e verifica se os bundles correspondem às respetivas fontes. A ordem da cascata é explicitamente preservada.

### Páginas institucionais e de serviço

Páginas como Construção, Facilities, Supply, Business Services, RFQ e credibilidade carregam várias folhas de estilo em separado. Há um núcleo recorrente — cabeçalho, tipografia, estilos institucionais, estilos premium e estilos de divisão — ao qual se juntam folhas específicas de cada página.

### SOURCE AO

SOURCE AO mantém folhas de estilo e scripts próprios, por exemplo `source-ao/sourceao.css`, `source-ao/opportunity-radar.css`, `source-ao/runtime-config.js` e módulos de sourcing. Existe também reutilização pontual de estilos institucionais do website.

A identidade e os componentes de SOURCE AO devem continuar separados do núcleo visual institucional, mesmo quando partilham infraestrutura ou utilitários.

## 3. Tokens CSS: famílias que exigem coordenação

A leitura das folhas CSS principais encontrou mais do que uma família de variáveis globais:

- `style.css`: tokens gerais como `--navy`, `--blue`, `--ink`, `--muted` e `--border`.
- `typography.css`: variáveis de família e escala tipográfica.
- `premium.css`: família `--premium-*`.
- `brand-lock.css`: tokens `--hm-brand-*` e aliases para variáveis genéricas e de divisão.
- `division.css`: família `--unit-*`.
- `site-review.css`: família `--hm-*` para cores, bordas, raio e sombra.

Há aliases e valores que se sobrepõem entre estas famílias. O seu comportamento efetivo depende da ordem de carregamento, especificidade e escopo dos seletores. Não é seguro substituir todas as variáveis por um conjunto novo sem primeiro comparar os valores computados nas páginas afetadas.

## 4. Decisões técnicas

1. **Não consolidar CSS em massa nesta fase.** Primeiro deve existir um registo dos tokens, da sua origem, valor e páginas consumidoras.
2. **Não agregar todos os scripts num bundle global.** Consentimento, analytics, assistant, lead intake e SOURCE AO têm responsabilidades diferentes e dependências de execução.
3. **Preservar bundles já verificados.** A homepage e Clean já possuem um processo explícito de geração e validação CSS; esse mecanismo deve ser mantido até existir uma alternativa testada.
4. **Criar um núcleo comum com fronteiras claras.** Cabeçalho, tipografia, cores institucionais, botões e espaçamentos podem ser normalizados progressivamente, mantendo componentes e estilos particulares de cada divisão.
5. **Tratar SOURCE AO como subsistema de produto.** A integração deve ocorrer por contratos partilhados, não por mistura indiscriminada de estilos e scripts.

## 5. Limites da medição

O mapa conta apenas referências declaradas em tags `<link rel="stylesheet">` e `<script src>` nos 51 documentos HTML do repositório. Não deteta:

- imports dinâmicos de JavaScript;
- `@import` CSS;
- pedidos de rede iniciados em runtime;
- seletores CSS não utilizados;
- scripts injetados por terceiros;
- diferenças de comportamento por consentimento, browser ou viewport.

O mapa é um inventário estrutural, não um profiler de runtime nem uma medição de performance.

## 6. Próxima intervenção recomendada

A próxima alteração de código deve ser limitada a uma camada de tokens e componentes comuns, após criar uma matriz com: token, valor, folha de origem, páginas consumidoras e prioridade de cascata. A homepage aprovada deve permanecer visualmente inalterada durante esta etapa.

Só depois dessa matriz deve ser criado um protótipo isolado para comparar a arquitetura atual com uma opção baseada em Astro e componentes interativos React, usando páginas e componentes representativos e métricas equivalentes.
