# HMATIAS — Inventário de migração e prontidão para produção

Data de referência: 13 de novembro de 2026

Este inventário separa o que já foi recriado no protótipo Astro, o que continua deliberadamente no website oficial e os controlos que ainda impedem uma migração. O protótipo é independente e não substitui o publisher oficial.

## 1. Páginas já recriadas no protótipo Astro

O protótipo gera agora 50 páginas estáticas: 25 em Português (pt-AO) e 25 em Inglês.

| Área | Português | Inglês | Situação |
|---|---|---|---|
| Homepage | `/` | `/en/` | Quatro áreas de atividade e galeria inicial |
| Sobre a HMATIAS | `/empresa/` | `/en/about/` | Apresentação factual, identificação empresarial e quatro áreas de atividade |
| KARTA Wallet | `/karta/` | `/en/karta/` | Projeto Alpha; separa componentes em desenvolvimento de objetivos futuros, sem alegar disponibilidade pública |
| Estaleiro Integrado | `/estaleiro/` | `/en/integrated-yard/` | Estudo preliminar com duas plantas vectoriais, áreas e ressalvas técnicas; não apresentado como obra executada |
| Credibilidade | `/credibilidade/` | `/en/credibility/` | Identificação empresarial, contactos e dados de registo |
| Construção | `/construcao/` | `/en/construction/` | Serviços e registos de obras reais; ligação para coberturas industriais e remodelação de escritórios |
| Coberturas industriais | `/coberturas-industriais/` | `/en/industrial-roofing/` | Avaliação, reparação localizada e manutenção programada, sujeitas a levantamento técnico |
| Remodelação de escritórios | `/remodelacao-de-escritorios/` | `/en/office-remodelling/` | Organização do espaço, acabamentos, reparações e coordenação da intervenção |
| Limpeza pós-obra | `/limpeza-pos-obra/` | `/en/post-construction-cleaning/` | Preparação de espaços, superfícies, pavimentos e áreas acessíveis, com escopo acordado |
| EPI e fardamento | `/fornecimento-de-epi-e-fardamento/` | `/en/ppe-workwear/` | Especificações, normas, tamanhos, quantidades e condições de fornecimento sujeitas a confirmação |
| Facilities | `/facilities/` | `/en/facilities/` | Serviços e intervenções de manutenção; ligação contextual para HMATIAS Clean |
| HMATIAS Clean | `/clean/` | `/en/clean/` | Catálogo Taurus com 100 referências, pesquisa por nome/código/descrição, dois produtos em destaque e preparação de pedido multiartigo manual (até 20 artigos) |
| Supply | `/supply/` | `/en/supply/` | Categorias, procurement e encaminhamento para pedidos |
| Business Services | `/business-services/` | `/en/business-services/` | Seis áreas de serviço e ligações para os canais de pedido existentes |
| Catálogo de Obras | `/catalogo-obras/` | `/en/works-catalogue/` | Doze registos fotográficos do arquivo |
| Blog | `/blog/` | `/en/blog/` | Listagem e artigo de orientação sobre pedidos de cotação |
| SOURCE AO | `/source-ao/` | `/en/source-ao/` | Página própria de sourcing e cobertura de mercado, com percurso dedicado para RFQ multiartigo |
| SOURCE AO RFQ | `/source-ao/smart-rfq/` | `/en/source-ao/smart-rfq/` | Formulário multiartigo bilingue; regista no backend SOURCE AO apenas quando a API de staging estiver configurada; sem ligação à base de produção a partir do preview |
| SOURCE AO Radar | `/source-ao/radar/` | `/en/source-ao/radar/` | Oportunidades públicas aprovadas, activas, em Angola e com prazo válido; sem dados internos; encaminhamento contextual para Smart RFQ; feed identificado como não configurado até ligação ao staging |
| Candidatura de parceiros SOURCE AO | `/source-ao/parceiros/` | `/en/source-ao/partners/` | Formulário bilingue, desactivado sem API de staging; consentimento explícito, registo de data/versão do aviso, contactos cifrados e fila de revisão privada; resposta pública apenas com referência e estado |
| Acessibilidade | `/acessibilidade/` | `/en/accessibility/` | Compromisso e canal para comunicar dificuldades |
| Privacidade | `/privacidade/` | `/en/privacy/` | Política em português e inglês, com distinção entre preview e site oficial |
| Termos | `/termos/` | `/en/terms/` | Termos gerais em português e inglês |

O alternador de idioma associa as páginas PT e EN correspondentes, incluindo os dois slugs do artigo do Blog. A tradução das páginas acima está criada, mas a revisão editorial bilingue integral e a validação de todas as ligações continuam a fazer parte da revisão final.

O Smart RFQ geral é um formulário de preparação de pedido independente: recolhe os dados no navegador, valida os campos da área selecionada, gera um resumo e uma referência local e só abre o canal escolhido pelo utilizador (e-mail ou WhatsApp). Não envia dados para um servidor, não regista pedidos, não gera cotações e não confirma stock nem prazos. O formulário multiartigo e o contrato de registo do SOURCE AO foram integrados no novo percurso Astro. No preview, a API fica desactivada por omissão e só aceita uma base HTTPS de staging explicitamente configurada; o publisher oficial continua operacional até validação e aprovação da migração.

## 2. Funcionalidades que permanecem no domínio oficial

Estas ligações foram mantidas intencionalmente para não substituir formulários funcionais por formulários de demonstração:

| Função | Rota/canal preservado |
|---|---|
| Formulário de contacto principal | `https://comercialhmatiasps.com/#contacto` |
| Pedido de orçamento Business Services | `https://comercialhmatiasps.com/servicos-administrativos.html#contacto-business` |
| Agendamento Business Services | `https://comercialhmatiasps.com/agendamento.html` |
| RFQ SOURCE AO operacional | `/source-ao/rfq.html` no domínio oficial; preview em `/source-ao/smart-rfq/` e `/en/source-ao/smart-rfq/` |
| Formulário RFQ em inglês | `https://comercialhmatiasps.com/rfq-en.html` |
| SOURCE AO | `/source-ao/index.html` no domínio oficial |
| Radar de oportunidades SOURCE AO | `/source-ao/opportunity-radar.html` no domínio oficial; preview Astro em `/source-ao/radar/` e `/en/source-ao/radar/` |
| Candidaturas de parceiros SOURCE AO | `/source-ao/partner-application.html` no domínio oficial; preview Astro em `/source-ao/parceiros/` e `/en/source-ao/partners/` |
| Privacidade e termos específicos do SOURCE AO | `/source-ao/privacy.html` e `/source-ao/terms.html` no domínio oficial |

Os formulários dependem de integrações de receção segura, consentimento, Cloudflare Turnstile, Cloudflare D1 e, conforme o fluxo, notificações. A migração só deve ocorrer depois de testar origem permitida pela API, consentimento, registo, referência de confirmação, tratamento de falhas e canal manual alternativo.

## 3. Páginas e funções ainda não recriadas

As páginas abaixo continuam por recriar ou dependem de equivalência funcional. A KARTA já tem uma versão informativa no preview; as URLs antigas continuam protegidas até à revisão final do estado do produto e aprovação da migração.

| Página atual | Conteúdo / função | Estado |
|---|---|---|
| `/rfq.html` | Construtor antigo de briefing RFQ por área de serviço | Não migrado; não confundir com o SOURCE AO RFQ |
| `/clean.html` e `/clean-en.html` | HMATIAS Clean, catálogo Taurus e pedido multiartigo | Recriados no preview em `/clean/` e `/en/clean/`; fluxo de preparação e envio manual por WhatsApp/e-mail. Manter URLs oficiais até validação de equivalência, Search Console, backlinks e aprovação |
| `/karta.html` e `/karta-en.html` | Apresentação do projeto KARTA | Recriada no preview como `/karta/` e `/en/karta/`; manter as URLs oficiais até validar e aprovar a migração |
| `/agendamento.html` e `/booking.html` | Pedido de atendimento e preferência de horário | Mantidos no domínio oficial |
| `/coberturas-industriais.html` | Página especializada de coberturas industriais | Recriada no preview em `/coberturas-industriais/` e `/en/industrial-roofing/`; manter URL oficial até validar e aprovar a migração |
| `/limpeza-pos-obra.html` | Página especializada de limpeza pós-obra | Recriada no preview em `/limpeza-pos-obra/` e `/en/post-construction-cleaning/`; manter URL oficial até validar e aprovar a migração |
| `/fornecimento-de-epi-e-fardamento.html` | Página especializada de EPI e fardamento | Recriada no preview em `/fornecimento-de-epi-e-fardamento/` e `/en/ppe-workwear/`; manter URL oficial até validar e aprovar a migração |
| `/remodelacao-de-escritorios.html` | Página especializada de remodelação de escritórios | Recriada no preview em `/remodelacao-de-escritorios/` e `/en/office-remodelling/`; manter URL oficial até validar e aprovar a migração |
| `/estaleiro-integrado.html` e `/integrated-yard.html` | Projeto do Estaleiro Integrado | Recriado no preview em `/estaleiro/` e `/en/integrated-yard/`; manter URLs oficiais até validação e aprovação |

Não remover nem desindexar estas páginas antes de decidir o destino de cada uma. Algumas podem continuar relevantes para campanhas, pesquisa orgânica ou informação de projeto.

## 4. SEO, idiomas e indexação

- Todas as páginas do preview mantêm `noindex, nofollow`; o preview não deve competir com o domínio oficial nos motores de pesquisa.
- As rotas PT e EN têm alternador de idioma e metadados de idioma próprios.
- A implementação final de `hreflang`, URLs canónicas, sitemap, redirecionamentos e preservação das URLs antigas continua pendente.
- Não encaminhar silenciosamente visitantes de páginas inglesas para conteúdos em português.
- As páginas em falta na secção anterior devem manter-se disponíveis até existir um destino aprovado.

## 5. Integrações e controlos obrigatórios antes da migração

- Cookiebot e bloqueio de tags conforme o consentimento.
- Google Tag Manager e GA4, incluindo validação de eventos e exclusão de dados pessoais.
- Website Lead API, Cloudflare Turnstile e Cloudflare D1 para contacto, Business Services e agendamento.
- SOURCE AO API, RFQ multiartigo, referência privada, acompanhamento e respostas de erro.
- Assistente virtual e ponte API atualmente utilizada.
- Formulários manuais de contacto via WhatsApp e e-mail como alternativa.
- Robots, canonicals, sitemap, redirecionamentos, páginas de erro e preservação de URLs históricas.
- Revisão visual em desktop e dispositivos móveis.
- Playwright, axe-core, Lighthouse e revisão manual dos formulários.
- Revisão editorial final das versões PT e EN.

## 6. Estado técnico observado

No workflow **Astro prototype QA #474**, commit `bd7d1451`, concluído com sucesso em 11 de novembro de 2026:

- Auditoria de dependências: aprovada.
- Astro Check: 0 erros, 0 avisos e 0 indicações.
- Build estático: 28 páginas geradas.
- Verificação personalizada: aprovada; 98 recursos processados e 7 imagens na homepage com texto alternativo.
- Testes de contrato e persistência do SOURCE AO: aprovados.
- Playwright: 115 testes passaram em Chromium desktop e WebKit móvel; 13 casos foram ignorados por estarem limitados ao perfil oposto (desktop ou móvel).
- axe-core: nenhum problema de impacto crítico ou grave nas rotas abrangidas.
- Lighthouse CI: 24 relatórios concluídos em 12 rotas, com duas medições por rota.

**Resultados Lighthouse nesta pré-visualização:**

| Indicador | Resultado observado |
|---|---:|
| Desempenho | 100/100 em 24 medições |
| Acessibilidade | 100/100 em 24 medições |
| Boas práticas | 100/100 em 24 medições |
| SEO | 63/100 em 24 medições |
| LCP | 203–545 ms |
| CLS máximo | 0,043 |

A pontuação SEO de 63/100 é uma consequência esperada da diretiva `noindex, nofollow`: o Lighthouse assinala a página como bloqueada para indexação. Esta proteção é intencional no preview e deve manter-se até à decisão de publicação. Não se deve remover o `noindex` apenas para elevar a pontuação do ambiente de testes. Canonicals, `hreflang`, sitemap, redirecionamentos e indexabilidade do publisher de produção continuam sujeitos à validação final.

Os relatórios Playwright e Lighthouse foram guardados no artefacto `hmatias-browser-quality-reports` do workflow #474. A aprovação do CI confirma o comportamento automatizado coberto pelos testes; não substitui a revisão editorial e visual humana nem a submissão real dos formulários operacionais.

Continuam pendentes a revisão visual manual em vários dispositivos, a navegação integral apenas por teclado e o teste de ponta a ponta de pedidos reais nos canais de produção.
## 7. Estado de publicação

- O ambiente Astro é um projecto Vercel separado, ligado à pasta `platform/astro-preview`; o publisher oficial não está associado a este projecto.
- O domínio oficial e a homepage oficial não foram migrados.
- Não foram alterados DNS nem publisher de produção.
- Os formulários operacionais acima permanecem no website oficial.
- O preview mantém `noindex, nofollow`.
- Esta versão **não está aprovada para publicação em produção** enquanto a validação Playwright/axe/Lighthouse, a revisão manual e os testes reais dos formulários não estiverem concluídos.

## 8. Atualização de prontidão — 12 de novembro de 2026

Esta secção substitui os resultados de execução anteriores como referência do head `a6a95ee`.

### Inventário e proteção de URLs

- O inventário do sitemap legado tem **37 URLs**.
- Foram também registadas **5 páginas adicionais do repositório** que precisam de consulta no Search Console e nos dados de tráfego.
- O inventário executável está em `migration/legacy-url-manifest.json` e é verificado por `scripts/verify-migration-readiness.mjs`.
- Cada URL tem uma decisão e justificação. Os destinos Astro são verificados contra o diretório `dist`; as páginas sem equivalente são marcadas para preservação no publisher oficial.
- O script reprova se faltar uma URL do inventário, existir duplicação, faltar um destino Astro declarado ou um destino do preview deixar de conter `noindex,nofollow`.
- A verificação não cria redirects nem altera qualquer configuração de produção. A variável `production_changes_permitted` permanece `false`.

### Resultados do workflow Astro prototype QA #602

- Auditoria de dependências: aprovada.
- Astro Check, build estático e verificação do artefacto: aprovados.
- Contrato e persistência do SOURCE AO RFQ: aprovados.
- Playwright desktop/mobile e axe: **117 testes aprovados**.
- Lighthouse CI: **48 relatórios**, cobrindo 24 rotas com duas medições por rota.
- Desempenho: **100/100 em 48 medições**.
- Acessibilidade: **100/100 em 48 medições**.
- Boas práticas: **100/100 em 48 medições**.
- SEO: **66/100 em 48 medições**, devido ao bloqueio intencional `noindex,nofollow` do preview.
- LCP observado em laboratório: **203–645 ms**.
- CLS observado em laboratório: **0–0,034**.

Estes valores resultam da execução local do Lighthouse CI no ambiente GitHub Actions. Não representam medições em produção, dispositivos físicos ou redes móveis angolanas. Não remover `noindex,nofollow` para alterar a pontuação SEO do preview.

### Workflows de integração

No mesmo head foram concluídos com sucesso:

- Source AO Data Quality #975.
- HMATIAS AI Worker Deploy #56: validação de configuração, health endpoint e resposta IA no endpoint `workers.dev`; o job de deploy adicional foi ignorado.
- Vercel: deployment de preview marcado como Ready.

### Bloqueios ainda abertos para produção

1. Validar a equivalência editorial e funcional de HMATIAS Clean, das quatro páginas especializadas, KARTA e Estaleiro Integrado; preservar agendamento/booking até existir substituto equivalente, sem inventar conteúdo ou substituir funções por demonstrações.
2. Testar de ponta a ponta o formulário de contacto, Business Services, agendamento, RFQ operacional SOURCE AO, consentimento, tracking, notificações e alternativa manual.
3. Obter exportação do Search Console e relatório de backlinks/referral traffic; completar a decisão de migração URL a URL.
4. Executar revisão visual manual desktop/tablet/mobile, navegação integral por teclado e verificação com tecnologias de apoio.
5. Validar legalmente as políticas e os termos, e confirmar a equivalência bilingue final.
6. Só depois aprovar redirects, canonical, hreflang, sitemap e janela de migração com plano de rollback.

**Estado:** os quality gates automatizados do protótipo estão verdes. A cobertura editorial e técnica do preview avançou, mas a migração completa e a publicação em produção continuam bloqueadas pelos itens acima. Nenhum merge, DNS, redirect ou deploy do domínio oficial é autorizado por esta etapa.


### Nota de migração KARTA

A nova página Astro `/karta/` e a respetiva versão `/en/karta/` foram criadas a partir do conteúdo atualmente publicado em `karta.html` e `karta-en.html`. A página apresenta o produto como pré-lançamento / Alpha, descreve apenas componentes sujeitos a desenvolvimento e validação, e identifica OCR/MRZ, partilha seletiva, QR e KARTA Verify/API como objetivos futuros. O contacto é encaminhado por e-mail; não foi criado formulário de registo nem promessa de lançamento.

As URLs antigas `/karta.html` e `/karta-en.html` continuam no inventário e não são redirecionadas. A equivalência editorial e o estado do produto devem ser revistos antes de qualquer substituição no publisher oficial.


### Nota de migração do Estaleiro Integrado

As rotas Astro `/estaleiro/` e `/en/integrated-yard/` foram criadas a partir das páginas antigas `estaleiro-integrado.html` e `integrated-yard.html`. O conteúdo preserva o estado de estudo preliminar, a área de 378,53 m², as dimensões de referência de 15,141 × 25 m, as duas alternativas de implantação, as áreas dos armazéns e as ressalvas necessárias antes de qualquer construção. As plantas vectoriais originais foram integradas no preview, com opção de abertura em tamanho integral.

As páginas não afirmam que o estaleiro esteja construído ou licenciado. As URLs oficiais antigas permanecem sem redirecionamento até aprovação da equivalência e do mapa final.

## 9. Correção do ambiente de pré-visualização — 12 de novembro de 2026

A primeira URL Vercel anteriormente partilhada (`hmatias-site-test`) estava a servir o publisher antigo, apesar de o deployment aparecer como Ready. A resposta HTTP da homepage continha o canonical do domínio oficial e a rota Smart RFQ devolvia 404. Essa URL não deve voltar a ser usada para validar o protótipo Astro.

Foi criado um projecto Vercel separado, ligado à pasta `platform/astro-preview`, com framework Astro, build `npm run build` e output `dist`. O deployment dedicado `hmatias-astro-preview` foi confirmado como Ready. A resposta HTTP 200 foi verificada para `/`, `/source-ao/smart-rfq/`, `/en/source-ao/smart-rfq/` e `/empresa/`.

A homepage e as páginas servidas contêm os recursos processados em `/_astro/`, não o HTML antigo do publisher. A pré-visualização mantém `noindex, nofollow`, não possui o domínio oficial associado e não altera DNS nem produção.

URL de pré-visualização validada: https://hmatias-astro-preview-3z8cv9xdz-hmatias.vercel.app/

Em 13 de novembro de 2026, o head `260b1a2c8e34c5190b9655dac171d0a7811f6fee` tem o workflow Astro prototype QA #43330488115 na fila de execução. A cobertura Playwright/axe inclui as quatro páginas especializadas em PT e EN, além de uma verificação do carrinho dinâmico HMATIAS Clean nos dois idiomas. A configuração Lighthouse foi ampliada para as 44 rotas estáticas (22 pares PT/EN), com duas medições por rota. Os resultados do ciclo actual permanecem pendentes até à conclusão do workflow; não devem ser confundidos com as medições históricas registadas acima.

**Estado de produção:** nenhum merge, redirect, alteração DNS ou publicação no domínio `comercialhmatiasps.com` foi realizado.

### Nota de migração HMATIAS Clean — 12 de novembro de 2026

As rotas Astro `/clean/` e `/en/clean/` foram acrescentadas como componente bilingue. A página preserva as duas referências em destaque (123 Pine Gel 500 ml e Taurus Pine Gel T563P), a ligação para o catálogo técnico Taurus do fabricante e as **100 referências** do catálogo legado, com categorias, códigos, descrições PT/EN e formatos indicados pelo fabricante.

O formulário permite preparar um pedido com vários artigos (até 20), formato e quantidade por item, dados de contacto, localização de entrega e consentimento. O pedido é revisto no navegador e enviado manualmente pelo canal escolhido (WhatsApp ou e-mail). Não existe submissão ao servidor, registo automático de encomenda, cálculo de cotação nem confirmação de stock, preço ou prazo. Estes continuam sujeitos a confirmação comercial da HMATIAS.

As imagens e os formatos dos produtos são referências de identificação. A menção à Taurus não afirma representação exclusiva, parceria ou exclusividade comercial. As URLs antigas `/clean.html` e `/clean-en.html` permanecem no inventário, sem redirect, até à revisão de Search Console/backlinks e aprovação explícita da migração.


### Nota de migração das páginas especializadas — 12 de novembro de 2026

Foram recriadas em PT-AO e inglês quatro páginas especializadas, com conteúdo baseado nas páginas HTML existentes: Coberturas Industriais, Limpeza Pós-Obra, Fornecimento de EPI e Fardamento e Remodelação de Escritórios. Cada uma mantém intenção de pesquisa, âmbito e informações úteis para preparar o pedido, sem afirmar disponibilidade, preço, prazo ou execução antes de avaliação e confirmação.

As páginas encaminham para o Smart RFQ com a área HMATIAS e o título do serviço pré-seleccionados. O visitante continua a preencher, rever e escolher o envio manual por e-mail ou WhatsApp. A pré-selecção não submete o pedido ao servidor, não cria uma cotação e não confirma adjudicação. As páginas-mãe de Construção, Facilities e Supply incluem ligações para os respectivos serviços especializados.

As quatro URLs HTML históricas permanecem no inventário, sem redireccionamento, até à revisão de Search Console/backlinks, validação da equivalência e aprovação explícita da migração.


## 10. SOURCE AO Radar e rede de parceiros — 13 de novembro de 2026

Foram acrescentadas duas rotas bilingues ao preview Astro: Radar público (`/source-ao/radar/`, `/en/source-ao/radar/`) e candidatura de parceiros (`/source-ao/parceiros/`, `/en/source-ao/partners/`). O inventário passa a 50 páginas estáticas, 25 por idioma.

**Radar:** utiliza o endpoint público existente, que filtra oportunidades angolanas aprovadas para publicação, activas e com prazo ainda válido. Não lê filas administrativas nem expõe identidade/contactos de fornecedores, custos de aquisição, margens ou notas comerciais privadas. O botão de análise encaminha para o Smart RFQ no mesmo idioma, com título, localização, referência pública, fonte e prazo pré-preenchidos. Enquanto a API de staging não estiver configurada, a interface informa que o feed não está ligado e não apresenta dados fictícios.

**Candidatura de parceiros:** reutiliza o endpoint privado existente. Exige consentimento afirmativo, guarda data e versão do aviso, mantém NIF/registo e dados de contacto dentro do perfil cifrado, e devolve publicamente apenas referência e estado. A listagem e leitura integral continuam protegidas por autenticação administrativa. A política de privacidade PT/EN foi actualizada para descrever dados, finalidades e limites do processo. A candidatura não é um directório público e não garante aceitação ou adjudicação.

A migração D1 `0027_partner_application_privacy_consent.sql` acrescenta os campos de auditoria de consentimento. Registos históricos permanecem sem preenchimento retroactivo, uma vez que não é possível inferir consentimento anterior. Esta migração ainda deve ser aplicada no ambiente de staging antes de se activar a submissão; o fluxo público continua desactivado por omissão e nunca deve apontar para a base de produção.

Os testes backend do ciclo passaram com **172 testes aprovados e zero falhas**, incluindo mapeamento Radar → RFQ, ausência de campos internos na URL, rejeição de candidaturas sem consentimento, resposta pública sem contactos e migração sem backfill de consentimento. A validação Astro do head em execução deve ser consultada antes de se declarar a aprovação final do build, navegador, acessibilidade e Lighthouse.

### Estado de ambiente e publicação

- O preview é alojado num projecto Vercel independente. Os checks automáticos do provider reportaram bloqueio temporário por limite de deploy (mensagem de nova tentativa em 24 horas); não foi possível confirmar uma nova pré-visualização pública para estas alterações.
- O build estático já gerou 50 páginas no ciclo anterior; a verificação editorial identificou uma grafia antiga no formulário e esta foi corrigida. A validação subsequente deve ser considerada a referência definitiva quando concluir.
- O preview mantém `noindex, nofollow`; as rotas RFQ e parceiro não recebem submissões de produção.
- A PR #316 permanece aberta e em rascunho. Não foi feito merge, deploy do domínio oficial, alteração DNS, redirect ou substituição da homepage aprovada.

**Estado:** funcionalidades integradas em preview e sujeitas a validação final. A migração e publicação em produção continuam não autorizadas.
