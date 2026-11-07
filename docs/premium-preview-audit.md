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


## Auditoria geral de navegação e integridade — 07-11-2026

Branch: `feat/institutional-operating-phase-20261106`
Commit testado: `d6d3cf99baba442eeb2b5fa6dd889ed8c1403755`

### Navegação e recursos
- Analisadas 56 referências de ligação na pré-visualização premium (36 destinos únicos).
- Verificadas a existência dos ficheiros locais, destinos de âncora e os principais percursos entre a pré-visualização e as páginas internas.
- Nenhum ficheiro local em falta ou âncora estática quebrada foi encontrado nas 12 páginas representativas verificadas.
- O destino `#pedido-supply` é criado pelo `supply-request.js` em tempo de execução e carregado a partir do `script.js`; foi validado por leitura do código, não por clique real no browser.
- O sitemap contém 37 URLs, sem duplicados nem referências a ficheiros inexistentes. As novas páginas de equipa, parceiros, catálogo de fornecimentos e a pré-visualização permanecem fora do sitemap.
- As sete imagens da pré-visualização têm texto alternativo e todos os campos do formulário premium têm labels correspondentes.

### Formulários
- O formulário premium `contactForm` tem validação HTML, consentimento obrigatório e fluxo de preparação para WhatsApp/e-mail.
- O formulário não grava automaticamente o pedido num CRM ou backend; a pessoa tem de concluir o envio na aplicação escolhida.
- O construtor de Supply e o Smart RFQ têm código de tratamento de submissão e validação; os fluxos não foram submetidos com dados reais nem testados ponta a ponta nesta auditoria.

### Deploy de pré-visualização
- Vercel `hmatias-site-test`: estado `READY`.
- Build concluído para o commit acima, na branch de desenvolvimento.
- A homepage pública de `main`, domínio e DNS não foram alterados.
- A tentativa de leitura da URL de pré-visualização pelo leitor web não foi autorizada; por isso, não se declara validação visual ou clique real no browser.

### Limitações e bloqueios
- Os workflows de Lighthouse e integridade estão configurados para `pull_request` dirigido a `main` ou `workflow_call`; não há execução desses testes associada ao commit testado. Lighthouse, Core Web Vitals e teste em Android real permanecem por executar.
- A branch está divergente de `main` (161 commits à frente e 4 atrás no momento da auditoria); reconciliar antes de qualquer pull request/integração.
- Existe contradição documental sobre a SYNVOR Industrial: `data/partners.json` classifica como "Parceria aprovada", enquanto este documento de fase classifica a relação como em desenvolvimento e não formalizada. Não publicar a classificação até validação expressa da gerência.
- As fotografias e respectivas legendas devem ser validadas documentalmente antes de publicação; a presença do ficheiro não prova autoria, autorização ou correspondência do trabalho.

### Correcção aplicada
- O CTA "Conhecer a HMATIAS" foi redireccionado da própria secção para `credibilidade.html`.
