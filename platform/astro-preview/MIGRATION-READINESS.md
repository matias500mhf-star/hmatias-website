# HMATIAS — Inventário de migração e prontidão para produção

Data de referência: 12 de novembro de 2026

Este inventário separa o que já foi recriado no protótipo Astro, o que continua deliberadamente no website oficial e os controlos que ainda impedem uma migração. O protótipo é independente e não substitui o publisher oficial.

## 1. Páginas já recriadas no protótipo Astro

O protótipo gera agora 30 páginas estáticas: 15 em Português (pt-AO) e 15 em Inglês.

| Área | Português | Inglês | Situação |
|---|---|---|---|
| Homepage | `/` | `/en/` | Quatro áreas de atividade e galeria inicial |
| Sobre a HMATIAS | `/empresa/` | `/en/about/` | Apresentação factual, identificação empresarial e quatro áreas de atividade |
| KARTA Wallet | `/karta/` | `/en/karta/` | Projeto Alpha; separa componentes em desenvolvimento de objetivos futuros, sem alegar disponibilidade pública |
| Credibilidade | `/credibilidade/` | `/en/credibility/` | Identificação empresarial, contactos e dados de registo |
| Construção | `/construcao/` | `/en/construction/` | Serviços e registos de obras reais |
| Facilities | `/facilities/` | `/en/facilities/` | Serviços e intervenções de manutenção |
| Supply | `/supply/` | `/en/supply/` | Categorias, procurement e encaminhamento para pedidos |
| Business Services | `/business-services/` | `/en/business-services/` | Seis áreas de serviço e ligações para os canais de pedido existentes |
| Catálogo de Obras | `/catalogo-obras/` | `/en/works-catalogue/` | Doze registos fotográficos do arquivo |
| Blog | `/blog/` | `/en/blog/` | Listagem e artigo de orientação sobre pedidos de cotação |
| Smart RFQ | `/source-ao/smart-rfq/` | `/en/source-ao/smart-rfq/` | Página explicativa; encaminha para o RFQ operacional do SOURCE AO |
| Acessibilidade | `/acessibilidade/` | `/en/accessibility/` | Compromisso e canal para comunicar dificuldades |
| Privacidade | `/privacidade/` | `/en/privacy/` | Política em português e inglês, com distinção entre preview e site oficial |
| Termos | `/termos/` | `/en/terms/` | Termos gerais em português e inglês |

O alternador de idioma associa as páginas PT e EN correspondentes, incluindo os dois slugs do artigo do Blog. A tradução das páginas acima está criada, mas a revisão editorial bilingue integral e a validação de todas as ligações continuam a fazer parte da revisão final.

A página Smart RFQ é uma apresentação do fluxo, não um segundo motor de RFQ. O formulário multiartigo, a validação, o registo e o acompanhamento continuam no fluxo operacional existente em `/source-ao/rfq.html`.

## 2. Funcionalidades que permanecem no domínio oficial

Estas ligações foram mantidas intencionalmente para não substituir formulários funcionais por formulários de demonstração:

| Função | Rota/canal preservado |
|---|---|
| Formulário de contacto principal | `https://comercialhmatiasps.com/#contacto` |
| Pedido de orçamento Business Services | `https://comercialhmatiasps.com/servicos-administrativos.html#contacto-business` |
| Agendamento Business Services | `https://comercialhmatiasps.com/agendamento.html` |
| Smart RFQ / pedidos de fornecimento operacionais | `https://comercialhmatiasps.com/source-ao/rfq.html` |
| Formulário RFQ em inglês | `https://comercialhmatiasps.com/rfq-en.html` |
| SOURCE AO | `/source-ao/index.html` no domínio oficial |
| Radar de oportunidades SOURCE AO | `/source-ao/opportunity-radar.html` no domínio oficial |
| Privacidade e termos específicos do SOURCE AO | `/source-ao/privacy.html` e `/source-ao/terms.html` no domínio oficial |

Os formulários dependem de integrações de receção segura, consentimento, Cloudflare Turnstile, Cloudflare D1 e, conforme o fluxo, notificações. A migração só deve ocorrer depois de testar origem permitida pela API, consentimento, registo, referência de confirmação, tratamento de falhas e canal manual alternativo.

## 3. Páginas e funções ainda não recriadas

As páginas abaixo continuam por recriar ou dependem de equivalência funcional. A KARTA já tem uma versão informativa no preview; as URLs antigas continuam protegidas até à revisão final do estado do produto e aprovação da migração.

| Página atual | Conteúdo / função | Estado |
|---|---|---|
| `/rfq.html` | Construtor antigo de briefing RFQ por área de serviço | Não migrado; não confundir com o SOURCE AO RFQ |
| `/clean.html` e `/clean-en.html` | HMATIAS Clean e fluxo de cotação | Não migrados |
| `/karta.html` e `/karta-en.html` | Apresentação do projeto KARTA | Recriada no preview como `/karta/` e `/en/karta/`; manter as URLs oficiais até validar e aprovar a migração |
| `/agendamento.html` e `/booking.html` | Pedido de atendimento e preferência de horário | Mantidos no domínio oficial |
| `/coberturas-industriais.html` | Página especializada de coberturas industriais | Não migrada |
| `/limpeza-pos-obra.html` | Página especializada de limpeza pós-obra | Não migrada |
| `/fornecimento-de-epi-e-fardamento.html` | Página especializada de EPI e fardamento | Não migrada |
| `/remodelacao-de-escritorios.html` | Página especializada de remodelação de escritórios | Não migrada |
| `/estaleiro-integrado.html` e `/integrated-yard.html` | Projeto do Estaleiro Integrado | Não migrados |

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

- O ambiente Astro é um preview separado em Render.
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

1. Migrar ou preservar páginas HMATIAS Clean, KARTA, agendamento/booking, Estaleiro Integrado e páginas especializadas, sem inventar conteúdo ou substituir funções por demonstrações.
2. Testar de ponta a ponta o formulário de contacto, Business Services, agendamento, RFQ operacional SOURCE AO, consentimento, tracking, notificações e alternativa manual.
3. Obter exportação do Search Console e relatório de backlinks/referral traffic; completar a decisão de migração URL a URL.
4. Executar revisão visual manual desktop/tablet/mobile, navegação integral por teclado e verificação com tecnologias de apoio.
5. Validar legalmente as políticas e os termos, e confirmar a equivalência bilingue final.
6. Só depois aprovar redirects, canonical, hreflang, sitemap e janela de migração com plano de rollback.

**Estado:** os quality gates automatizados do protótipo estão verdes. A cobertura editorial e técnica do preview avançou, mas a migração completa e a publicação em produção continuam bloqueadas pelos itens acima. Nenhum merge, DNS, redirect ou deploy do domínio oficial é autorizado por esta etapa.


### Nota de migração KARTA

A nova página Astro `/karta/` e a respetiva versão `/en/karta/` foram criadas a partir do conteúdo atualmente publicado em `karta.html` e `karta-en.html`. A página apresenta o produto como pré-lançamento / Alpha, descreve apenas componentes sujeitos a desenvolvimento e validação, e identifica OCR/MRZ, partilha seletiva, QR e KARTA Verify/API como objetivos futuros. O contacto é encaminhado por e-mail; não foi criado formulário de registo nem promessa de lançamento.

As URLs antigas `/karta.html` e `/karta-en.html` continuam no inventário e não são redirecionadas. A equivalência editorial e o estado do produto devem ser revistos antes de qualquer substituição no publisher oficial.
