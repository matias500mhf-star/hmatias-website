# HMATIAS — execução da auditoria geral do website
Data de atualização: 09/10/2026.

## Critérios aprovados
1. Quatro divisões principais: Construção, Facilities & Manutenção, Supply & Procurement e Business Services.
2. HMATIAS Clean permanece integrada em Facilities.
3. Homepage congelada quanto a estrutura e imagem: não fazer reorganizações desnecessárias.
4. Provar execução por fotografias de trabalhos reais; não usar fotografias genéricas, falsas certificações, preços e disponibilidades sem validação.
5. Um único email de contacto em produção: geral@comercialhmatiasps.com.
6. KARTA como produto Alpha na área de Inovação e Projetos Digitais; Source AO como apoio operacional à área Supply, em evolução.
7. Termos de sourcing profissionais e resultados rastreáveis; investigação pública não equivale a stock confirmado.

## Feito nesta ramificação — pendente de integração
| Tema | Alteração | Estado |
|---|---|---|
| Identidade e valores | Missão, visão e princípios técnicos/comerciais em Informação Institucional PT/EN | Alterado; aguarda merge e revisão visual |
| Posicionamento digital | Secção Inovação e Projetos Digitais com KARTA e Source AO na Informação Institucional PT/EN | Alterado; aguarda merge |
| KARTA | Fase Alpha explícita, linguagem que evita declarar autenticação/criptografia concluída sem testes e ligação à secção digital | Alterado em PT/EN |
| Source AO | Headlines, metadados e textos PT/EN centrados em pesquisa técnica, registos indexados e confirmação comercial | Alterado; aguarda teste visual/funcional |
| SEO | lastmod do sitemap ajustado apenas nos cinco endereços alterados | Alterado; indexação Google continua não validada |
| Homepage | Estrutura existente de quatro áreas preservada, sem edição nesta ramificação | Sem alterações |

## Problemas não encerrados — ordem de prioridade
### P0 — Receita, captação e comunicação
- **Formulário institucional**: homepage, Smart RFQ, Business Services, Clean e agendamento continuam sem prova de persistência e entrega automática. O módulo `lead-intake/` está preparado, mas desativado. Dependências: D1, Turnstile, HubSpot, Resend e testes de ponta a ponta.
- **Alertas Source AO / Resend**: a verificação de 09/10 encontrou 1 alerta pendente e 0 aceites pelo serviço; autenticação/configuração final e receção na caixa oficial devem ser confirmadas com teste autorizado. Não assumir resolvido por domínio verificado.
- **Operação comercial**: separar pedidos recebidos, atribuídos, fornecedores contactados, RFQs emitidos, propostas, adjudicações e negócios perdidos. Não contar cliques como leads efetivos.

### P1 — Pesquisa técnica e sourcing
- O Source AO existente usa fonte curada/indexada; descoberta externa assistida está no PR #177, separado, com custos desativados por omissão.
- Piloto AI não é implementação em produção. Exige credenciais próprias, orçamento limitado, staging, fontes rastreáveis e validação de resultados com: cinta PP 9 mm, capacetes EPI, PVC 15 kg e fixadores ASTM A193 B7/Xylan.
- Não afirmar varrimento exaustivo em tempo real, fabricante verificado, stock, preço ou prazo sem evidência direta.

### P1 — Google, visibilidade e qualidade
- Consultar propriedade oficial no Google Search Console: URLs indexados vs. enviados, cobertura/canonicals/hreflang, cliques, impressões e termos não-marca.
- O sitemap contém URLs declarados, não comprova indexação. A ligação GSC Wizard apresentou restrição por subscrição na auditoria de 09/10.
- Verificar resultados móveis e desktop em produção, incluindo fotografias, menus, botões, hrefs, formulários e divergências de cache entre resultados Google e páginas atuais.

### P2 — Catálogo e conteúdo
- Validar fotografias reais e autorizações para todas as páginas e Google Business Profile.
- Confirmar fichas de produtos, EPI/fardamento, identificação de parceiros e capacidade operacional antes de apresentar ofertas.
- Melhorar casos comerciais por divisão: problema, intervenção, resultados, chamada para pedido de orçamento e forma de receber o pedido.
- Rever detalhes de linguagem por página PT/EN e evitar inglês desnecessário no conteúdo português.

## Critérios mínimos de aceitação de cada fase
- PR com revisão e CI verde, sem alterações de credenciais em texto.
- Teste real no browser móvel/desktop no domínio após deployment.
- Um contacto de teste e um RFQ de teste devem gerar referência persistente e notificação confirmada antes de afirmar que o lead-intake está operacional.
- Dados do Search Console oficial, não apenas `site:` nem sitemap, para relatório de indexação.
- Não declarar IA de pesquisa real operativa até testar com fornecedores e fontes verificáveis.
