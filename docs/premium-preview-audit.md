# HMATIAS — Auditoria inicial da pré-visualização premium

Data: 06-11-2026
Branch: `feat/institutional-operating-phase-20261106`
Estado: pré-produção; não publicada

## Verificações realizadas
- Confirmada a existência do logótipo, favicon e fonte Inter local referenciados pelo protótipo.
- Confirmada a existência das quatro imagens locais usadas na composição editorial.
- Confirmada a existência das páginas internas ligadas a partir do protótipo: credibilidade, construção, facilities, supply, serviços administrativos e catálogo de obras.
- Os 14 caminhos locais identificados no HTML foram encontrados na árvore da branch.
- Confirmada a presença da indicação visual e meta robots `noindex,nofollow` na pré-visualização.
- Não foi executado Lighthouse, teste em dispositivo Android real, teste de rede móvel nem medição de Core Web Vitals. As metas do padrão de desempenho continuam por medir.

## Correcção aplicada
- A navegação principal estava escondida em ecrãs até 650 px. Foi substituída por navegação horizontal compacta e acessível por toque, sem adicionar JavaScript ou dependências.
- Em mobile, foi removido o efeito de blur do cabeçalho para reduzir trabalho gráfico e manter o fundo opaco.
- Foi definido comportamento de imagem principal mais previsível em ecrãs pequenos e ajustado o espaçamento de âncoras para o cabeçalho em duas linhas.

## Limitações e próximos controlos
- A existência de um ficheiro de imagem não valida, por si só, a legenda, a autoria, a autorização de publicação ou a correspondência com o trabalho descrito. Cada fotografia e legenda deve ser confirmada antes de publicação.
- Os endereços de email e o funcionamento dos links mailto devem ser confirmados com o responsável da empresa.
- Executar testes de acessibilidade, layout em 320/360/390/430 px, tablet e desktop, Lighthouse e validação em Android com rede móvel limitada.
- Rever o peso real das imagens e fontes e definir variantes responsivas antes de qualquer publicação.

## Resultado
A correcção de navegação móvel foi gravada nesta branch. Não houve alteração da homepage pública, merge para `main`, deploy ou alteração de DNS.
