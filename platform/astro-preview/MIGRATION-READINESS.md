# HMATIAS — Inventário de migração e prontidão para produção

Data de referência: 11 de novembro de 2026

Este inventário separa páginas já recriadas no protótipo Astro, fluxos que continuam deliberadamente no website actual e trabalho pendente. O protótipo é independente e não substitui o publisher oficial.

## 1. Páginas institucionais já recriadas no Astro

| Área | Rota de pré-visualização | Situação |
|---|---|---|
| Homepage institucional | `/` | Estrutura Astro, quatro divisões e galeria inicial |
| Construção e Remodelação | `/construcao/` | Página de serviço e registos de obra |
| Facilities e Manutenção | `/facilities/` | Página de serviço e intervenções |
| Supply e Procurement | `/supply/` | Página de serviço, categorias e ligação ao sourcing |
| Business Services | `/business-services/` | Seis serviços do conteúdo actual, com ligações para pedidos |
| Sobre a HMATIAS / Credibilidade | `/empresa/` | Identificação, NIF, registo, missão, visão e divisões |
| Catálogo de Obras | `/catalogo-obras/` | Doze registos fotográficos do arquivo actual |
| Blog | `/blog/` | Estrutura criada; primeiro artigo continua em preparação |
| Acessibilidade | `/acessibilidade/` | Informação de compromisso; não declara conformidade auditada |
| Política de Privacidade | `/privacidade/` | Texto actual transposto; revisão final antes de produção |
| Termos e Condições | `/termos/` | Texto actual transposto; revisão final antes de produção |
| Smart RFQ | `/source-ao/smart-rfq/` | Página explicativa; encaminha para o RFQ operacional do Source AO |

A página Smart RFQ é uma apresentação do fluxo, não um segundo motor de RFQ. O formulário de vários artigos, validação, registo e acompanhamento continua a ser o fluxo operacional existente em `/source-ao/rfq.html`.

## 2. Funcionalidades que permanecem no domínio oficial

Estas ligações foram mantidas intencionalmente durante a avaliação para evitar substituir formulários funcionais por formulários de demonstração:

| Função | Rota/canal actualmente preservado |
|---|---|
| Formulário de contacto principal | `https://comercialhmatiasps.com/#contacto` |
| Pedido de orçamento Business Services | `https://comercialhmatiasps.com/servicos-administrativos.html#contacto-business` |
| Agendamento Business Services | `https://comercialhmatiasps.com/agendamento.html` |
| Smart RFQ / pedidos de fornecimento operacionais | `https://comercialhmatiasps.com/source-ao/rfq.html` |
| Source AO | `/source-ao/index.html` no domínio oficial |
| Radar de oportunidades Source AO | `/source-ao/opportunity-radar.html` no domínio oficial |
| Privacidade e termos específicos do Source AO | `/source-ao/privacy.html` e `/source-ao/terms.html` no domínio oficial |

Os formulários actuais dependem de integrações de recepção segura, consentimento, Cloudflare Turnstile, Cloudflare D1 e, conforme o fluxo, notificações. A cópia dessas interfaces para Astro só deve ocorrer depois de testar origem permitida pela API, consentimento, registo, referência de confirmação, tratamento de falha e canal manual alternativo.

## 3. Páginas ainda não recriadas

As páginas abaixo constam do sitemap actual e precisam de decisão explícita: migrar, manter temporariamente no domínio legado ou redireccionar depois de existir substituto equivalente.

| Página actual | Conteúdo / função | Estado |
|---|---|---|
| `/rfq.html` e `/rfq-en.html` | Construtor antigo de briefing RFQ por área de serviço | Não migrado; não confundir com Source AO RFQ |
| `/clean.html` e `/clean-en.html` | HMATIAS Clean e respectivo fluxo de cotação | Não migrado |
| `/karta.html` e `/karta-en.html` | Apresentação do projecto KARTA | Não migrado |
| `/agendamento.html` e `/booking.html` | Pedido de atendimento e preferência de horário | Mantido no domínio oficial |
| `/coberturas-industriais.html` | Página especializada de coberturas industriais | Não migrada |
| `/limpeza-pos-obra.html` | Página especializada de limpeza pós-obra | Não migrada |
| `/fornecimento-de-epi-e-fardamento.html` | Página especializada de EPI e fardamento | Não migrada |
| `/remodelacao-de-escritorios.html` | Página especializada de remodelação de escritórios | Não migrada |
| `/estaleiro-integrado.html` e `/integrated-yard.html` | Projecto do Estaleiro Integrado | Não migradas |

Não remover nem desindexar estas páginas antes de decidir o destino de cada uma. Algumas podem continuar relevantes para campanhas, pesquisa orgânica ou informação de projecto.

## 4. Cobertura bilingue

O website actual contém páginas em Português e Inglês. O protótipo Astro está, nesta fase, em Português (pt-AO). Ainda faltam:

- traduções EN para as páginas institucionais e de serviço já recriadas;
- alternadores de idioma e ligações recíprocas PT/EN;
- metadados `hreflang`, canónicos e Open Graph por idioma;
- decisão sobre o destino das URLs inglesas antigas.

As páginas inglesas existentes devem continuar disponíveis até existir uma versão equivalente validada. Não encaminhar silenciosamente visitantes de EN para conteúdos PT.

## 5. Integrações e controlos obrigatórios antes da migração

- Cookiebot e bloqueio de tags conforme consentimento.
- Google Tag Manager e GA4, incluindo teste dos eventos e exclusão de dados pessoais.
- Website Lead API, Cloudflare Turnstile e Cloudflare D1 para contacto, Business Services e agendamento.
- Source AO API, RFQ multi-artigo, referência privada, acompanhamento e respostas de erro.
- Assistente virtual e ponte API actualmente utilizada.
- Formulários manuais de reserva/contato via WhatsApp e e-mail como fallback.
- Robots, canonicals, sitemap, redirects, páginas de erro e preservação de URLs históricas.
- Testes visuais desktop/mobile, Playwright, axe, Lighthouse e revisão manual dos formulários.

O `noindex, nofollow` do preview deve manter-se durante a avaliação. O domínio oficial só deve receber a nova versão depois de aprovar conteúdo, rotas, integrações, SEO e resultados de QA.

## 6. Estado de publicação

- O ambiente Astro é um preview separado.
- O domínio oficial e a homepage oficial não foram migrados.
- Não foram alterados DNS nem publisher de produção.
- Os formulários operacionais acima permanecem no website actual.
- Os testes automatizados foram adicionados ao repositório, mas os resultados Playwright/axe/Lighthouse ainda precisam de confirmação no workflow; um build estático bem-sucedido não equivale a uma auditoria de navegador concluída.
