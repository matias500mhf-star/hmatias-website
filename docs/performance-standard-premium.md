# HMATIAS — Padrão de desempenho e experiência multidispositivo

Estado: requisito obrigatório da Fase Premium
Aplicação: homepage, páginas internas, portfólio, formulários e componentes comerciais
Ambiente: pré-produção; não autoriza publicação em produção

## Princípio
A qualidade visual nunca pode comprometer a velocidade, a legibilidade ou a utilização em redes móveis. A experiência deve ser mobile-first, sem tratar desktop, tablet ou ecrãs grandes como secundários.

## Metas de desempenho
Metas de aceitação, medidas em páginas representativas e em condições móveis realistas:
- LCP: até 2,5 s no percentil 75.
- INP: até 200 ms no percentil 75.
- CLS: até 0,1 no percentil 75.
- Lighthouse Performance: objectivo mínimo de 90 em mobile e 95 em desktop, sem substituir os Core Web Vitals reais.
- Evitar pedidos de rede, scripts e dependências que não acrescentem valor claro.
- Definir orçamento de transferência por página e revê-lo em cada release; homepage inicial: objectivo inferior a 1,5 MB no carregamento inicial, sem contar conteúdo carregado apenas após interacção.

## Imagens e media
- Preferir AVIF ou WebP com fallback adequado; servir dimensões responsivas através de srcset e sizes.
- Não enviar imagens de desktop em resolução integral para ecrãs pequenos.
- Definir width e height ou aspect-ratio para evitar saltos de layout.
- Carregar a imagem principal do primeiro ecrã com prioridade adequada; aplicar lazy-loading às imagens abaixo da dobra.
- Não usar vídeo de fundo, carrosséis automáticos ou WebGL pesado como decoração.
- Fotografias devem ser autênticas, autorizadas e relevantes; optimização não pode adulterar o conteúdo documental.

## CSS, JavaScript e fontes
- CSS modular, minificado em produção e sem bibliotecas visuais pesadas desnecessárias.
- JavaScript apenas para interacções reais; preferir HTML e CSS nativos quando suficientes.
- Scripts não críticos com defer ou carregamento após necessidade; evitar bloquear o primeiro render.
- Reduzir e dividir código quando o volume o justificar; remover dependências e código não utilizados.
- Usar fontes locais/subconjuntos apenas quando disponíveis e licenciados; limitar famílias e pesos. Manter fallback de sistema e font-display: swap.
- Evitar animações contínuas, parallax intenso e efeitos que provoquem repaint/reflow. Respeitar prefers-reduced-motion.

## Mobile-first e acessibilidade
- Testar primeiro a partir de 320 px de largura, depois 360, 390, 430 px, tablet e desktop.
- Alvos de toque confortáveis, navegação clara, formulários curtos e campos fáceis de preencher.
- Não depender de hover, efeitos ou gestos complexos.
- Garantir contraste, foco visível, títulos hierárquicos, labels e textos alternativos úteis.
- Conteúdo essencial, contactos e pedidos de orçamento devem funcionar sem animações e com JavaScript limitado.
- Verificar retrato e paisagem, teclado móvel aberto e ligações móveis lentas/instáveis.

## Testes obrigatórios antes de aprovar uma página
1. Lighthouse mobile e desktop, guardando resultados e identificando regressões.
2. Chrome DevTools em simulação de telemóvel e rede móvel limitada; validar também num dispositivo Android real.
3. Core Web Vitals, consola sem erros, pedidos 404, imagens/fontes em falta e formulários.
4. Testes de navegação por teclado, foco, contraste e prefers-reduced-motion.
5. Verificação de layout em 320 px, 360 px, 390 px, 430 px, tablet e desktop.
6. Confirmar que não existem imagens, fontes, scripts ou endpoints externos desnecessários.

## Critério de aprovação
Uma página só está pronta quando for visualmente consistente, responsiva, rápida, acessível e funcional. Qualquer efeito visual que prejudique essas condições deve ser simplificado ou removido. Resultados de laboratório não devem ser apresentados como Core Web Vitals reais; distinguir sempre testes simulados de dados de utilizadores.

## Limites de publicação
Este padrão aplica-se à pré-produção. Não efectuar merge para main, deploy, alteração de DNS ou publicação sem autorização explícita.