# HMATIAS — Matriz de requisitos competitivos e comerciais

**Data:** 13 de novembro de 2026  
**Âmbito:** pré-visualização Astro no PR #316. Este documento orienta a próxima ronda de trabalho; não autoriza merge, publicação, DNS ou substituição do website oficial.

## Objetivo de negócio

O website deve apresentar a HMATIAS com credibilidade, explicar as suas quatro áreas de atividade, demonstrar capacidade através de evidências verificáveis e converter visitas em pedidos comerciais acompanháveis. A avaliação não deve premiar funcionalidades decorativas nem alegações sem prova.

## Matriz de lacunas

| Prioridade | Requisito | Estado observado no protótipo | Lacuna / risco | Critério de aceitação |
|---|---|---|---|---|
| P0 | Integridade técnica e visual | Astro type-check, build e verificação gerada aprovados no último head; Playwright falhou num teste de imagem aplicado incorretamente ao viewport mobile | QA integral ainda não verde; Lighthouse não correu após a falha | Testes desktop/tablet/mobile e axe sem falhas bloqueantes; Lighthouse executado; revisão visual manual concluída |
| P0 | Portfólio com prova de execução | Catálogo de obras tem 12 registos fotográficos e nota explícita sobre limites probatórios | Registos ainda não estão estruturados como estudos de caso com datas, âmbito, papel da HMATIAS e resultados confirmados | Publicar apenas casos com autorização/evidência; cada caso distingue trabalho executado, fase, material e contexto; dados desconhecidos ficam omitidos |
| P0 | Capacidade e credenciais | Página de credibilidade apresenta identificação legal, contactos e condições comerciais | Não apresenta um dossier de capacidade verificável nem distingue claramente recursos próprios, parceiros e recursos mobilizáveis | Criar secção de capacidade com documentos autorizados, equipa/qualificações verificadas, equipamentos e parceiros identificados por estatuto real |
| P1 | Catálogo Supply | Categorias e canais de sourcing apresentados; Source AO dispõe de catálogo de referências e fluxo de RFQ; HMATIAS Clean apresenta 100 referências | Catálogo Supply geral ainda não funciona como vitrine organizada por categoria e especificação no site institucional | Categorias pesquisáveis, fichas/referências quando disponíveis, especificações e CTA de cotação; nunca indicar stock/preço/prazo sem confirmação |
| P1 | Conversão e gestão de leads | Smart RFQ institucional prepara briefing e encaminha manualmente; Source AO RFQ possui registo via API quando configurado | Percursos diferentes e acompanhamento comercial ainda não unificado; o formulário institucional não regista centralmente | Definir destino de cada formulário; confirmação real de submissão; ID de pedido; notificação e registo; estados e responsável comercial; fallback transparente |
| P1 | Confiança e transparência | Políticas, termos, acessibilidade e página de credibilidade existentes | Falta tornar mais fácil encontrar documentação comercial e explicar limites de serviço, origem de fornecimento e estatuto de parceiros | Trust Centre com documentos publicáveis, condições, contactos, política de dados e distinção entre parceiro, fonte de consulta e fornecedor contratado |
| P1 | Paridade PT/EN | Páginas institucionais e serviços especializados bilingues | Necessário verificar consistência de conteúdo, ligações recíprocas, metadados e linguagem comercial em todas as rotas | Auditoria automatizada de rotas e revisão humana de equivalência, sem traduções literais artificiais |
| P2 | SEO e descoberta | Canonical, hreflang, metadados, sitemap de preview e dados estruturados planeados/aplicados | A configuração de produção depende do mapa final de URLs e aprovação; preview deve continuar noindex | Auditoria de indexação, Search Console, sitemap de produção, canonical/hreflang finais e ausência de páginas duplicadas |
| P2 | Medição comercial | Eventos analíticos previstos e alguns eventos de RFQ existentes | Falta painel que ligue origem → contacto → pedido → proposta → venda | Eventos testados sem duplicação e relatório periódico de leads, propostas e conversões |
| P2 | Conteúdo de autoridade | Blog tem artigo bilingue prático sobre preparação de pedidos de cotação | Biblioteca editorial ainda pequena | Publicar conteúdo útil e específico, com autoria/revisão e exemplos reais; sem artigos genéricos de SEO |

## Decisões editoriais e de integridade

1. Não inventar clientes, certificações, licenças, alvarás, obras, volumes, prazos, stock, preços, equipas ou equipamentos.
2. Identificar projetos e fotografias apenas com autorização e evidência suficiente.
3. Distinguir claramente: trabalho executado pela HMATIAS; trabalho em parceria; referência de catálogo; imagem ilustrativa; projeto em estudo.
4. Não apresentar Source AO, KARTA ou outros projetos próprios como serviços comerciais já lançados se ainda estiverem em fase de desenvolvimento.
5. Não confundir pedido registado com cotação, adjudicação, stock confirmado ou contrato.
6. Manter a homepage preservada salvo correção comprovadamente necessária e autorizada.
7. Manter o preview isolado e noindex até aprovação explícita.

## Sequência de execução

### Fase A — Fecho de qualidade
- Corrigir o teste responsivo da fotografia da página Sobre: o requisito de altura desktop não pode ser aplicado ao viewport mobile.
- Reexecutar Playwright, axe e Lighthouse.
- Confirmar deploy do preview e rever manualmente páginas representativas em desktop e mobile.

### Fase B — Prova comercial
- Inventariar fotografias e documentos existentes.
- Selecionar casos que podem ser publicados e registar as evidências em falta.
- Criar modelos consistentes de estudos de caso, sem preencher campos não confirmados.
- Estruturar a página de capacidades com prova documental autorizada.

### Fase C — Supply e conversão
- Harmonizar o catálogo Clean, o catálogo de sourcing Source AO e a área Supply.
- Criar categorias e fichas comerciais com referências verificadas.
- Desenhar o percurso de pedido, registo, notificação e acompanhamento por área.
- Testar o percurso completo com pedidos de teste, sem enviar mensagens reais a clientes.

### Fase D — Lançamento controlado
- Rever SEO, acessibilidade, privacidade, segurança, analytics e migração de URLs.
- Comparar novamente com as referências nacionais e métricas técnicas equivalentes.
- Só avançar para merge/publicação após aprovação expressa.

## Estado atual

O PR #316 continua em Draft e isolado. A compilação e as verificações de conteúdo passaram no último head; a suite de navegador falhou num único teste porque a asserção de altura desktop foi aplicada também ao viewport mobile. A correção do teste não deve alterar o comportamento visual da fotografia. Lighthouse ficou por executar nessa corrida.
