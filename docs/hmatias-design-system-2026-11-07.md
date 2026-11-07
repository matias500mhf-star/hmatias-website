# HMATIAS — Sistema de Design Institucional
**Versão:** 1.0 · **Data:** 7 Novembro 2026  
**Branch:** `feat/institutional-operating-phase-20261106`  
**Estado:** Fundação criada em desenvolvimento; aplicação visual progressiva ainda sujeita a QA.

## 1. Decisão de identidade
A identidade azul existente é preservada. Não se aprova uma mudança de marca, nem a substituição dos botões azuis por creme. A evolução é incremental: melhor contraste, consistência, legibilidade, composição e navegação.

## 2. Referências externas consultadas
A análise foi feita sobre páginas públicas e documentação de referência, não por cópia de templates.

- **Apple —** página de entrada observada com navegação curta, uma mensagem por bloco, imagens de produto em grande escala e acções explícitas. Lição HMATIAS: reduzir competição entre mensagens e deixar fotografias reais dos trabalhos liderarem a narrativa.
- **Stripe —** navegação por Produtos, Soluções, Developers e Recursos; proposta de valor directa; demonstrações visuais e indicadores de escala. Lição HMATIAS: organizar capacidades por tarefa e público, não apenas por departamentos internos.
- **Linear —** navegação contida, hierarquia tipográfica forte e demonstração do produto dentro do próprio contexto. Lição HMATIAS: interfaces limpas, microinteracções com propósito e menos decoração.
- **IBM —** organização de um portefólio empresarial extenso por produtos, casos de uso e resultados. Lição HMATIAS: estruturar páginas profundas sem tornar o visitante dependente do menu principal.
- **Microsoft —** segmentação de conteúdos e chamadas para acção em diferentes áreas de negócio. Lição HMATIAS: separar percursos institucionais, comerciais e de suporte.
- **Wix Studio —** biblioteca de inspiração com filtros por tipo, funcionalidade e estilo. Lição HMATIAS: desenhar componentes responsivos por breakpoints, em vez de reduzir o desktop mecanicamente.
- **Framer Awards —** categorias distintas para visual design, storytelling, interacção, animação e grandes sites. Lição HMATIAS: avaliar separadamente estética, narrativa, comportamento e escalabilidade.
- **MS Noise (Webflow) —** estudo industrial com catálogo complexo, estrutura component-first, multilíngua e foco em SEO/performance. Lição HMATIAS: a página Supply deve ser uma experiência de catálogo clara, pesquisável e escalável, não uma lista genérica de categorias.

## 3. Paleta institucional — manter o azul actual
Os tokens estão definidos em `hm-design-system.css`.

| Papel | Cor | Uso |
|---|---|---|
| Azul institucional | `#062D56` | Cabeçalhos escuros, rodapé, fundos de autoridade |
| Azul de acção | `#0065CC` | Botões primários, links e estados activos |
| Azul profundo | `#0B477C` | Hover, navegação secundária |
| Azul claro | `#48BAF5` | Destaques decorativos, nunca texto pequeno sobre branco |
| Texto principal | `#102D4D` / `#071D33` | Títulos e corpo |
| Texto secundário | `#5D6D7D` | Descrições, apenas quando o contraste for confirmado |
| Fundo suave | `#F4F8FC` | Secções secundárias e superfícies |
| Linha | `#DCE6F0` | Divisores e contornos |

Creme não é cor de substituição da marca. Pode surgir pontualmente em fotografia ou editorial, sem dominar a interface.

## 4. Tipografia
- Display: Instrument Sans, títulos e headlines.
- Corpo: Manrope, parágrafos e leitura longa.
- Interface: Inter, navegação e controlos quando necessário para manter compatibilidade.
- Técnica: IBM Plex Mono, etiquetas, códigos, metadados e indicadores.

Regras: evitar pesos sintéticos; carregar fontes locais com `font-display:swap`; manter títulos com escala fluida; corpo normalmente 16–18px em desktop e não inferior a 16px em mobile para leitura principal; line-height de corpo 1.6–1.75; evitar tracking negativo excessivo em textos pequenos.

## 5. Componentes e comportamento
- Botão primário: azul actual, texto branco, contraste forte; hover escurece, não muda de identidade.
- Botão secundário: contorno azul ou branco conforme o fundo; nunca competir com a acção principal.
- Navegação: um destino por rótulo; activo visível; menus mobile com alvos de toque de pelo menos 44px.
- Cartões: menos altura, menos molduras, conteúdo alinhado; fotografias com proporções consistentes.
- Formulários: labels visíveis, mensagens de erro junto ao campo, confirmação de envio inequívoca.
- Motion: 160–240ms em interacções; animação de entrada apenas quando acrescenta orientação; respeitar `prefers-reduced-motion`.
- Focus: contorno de teclado visível e consistente.

## 6. Contraste e legibilidade
Adoptar WCAG 2.2 AA como critério de aceitação: 4.5:1 para texto normal, 3:1 para texto grande e 3:1 para componentes/indicadores visuais relevantes. Azul claro serve como detalhe; não usar como texto pequeno em fundo branco. Medir pares reais no contexto final antes de aprovar.

## 7. Sistema de layout
- Content width de referência: 1180px; textos longos mais estreitos (aprox. 65–75 caracteres por linha).
- Grelha desktop: 12 colunas ou composição editorial equivalente.
- Tablet: reduzir colunas antes de reduzir tipografia.
- Mobile: uma coluna principal; evitar overflow horizontal; CTA principal visível sem esconder contacto ou idioma.
- Espaçamento baseado numa escala de 4px; manter ritmos verticais consistentes.
- Raio discreto (3–8px); evitar cartões excessivamente arredondados e sombras pesadas.

## 8. Auditoria inicial do repositório
Inspecção estática da branch de desenvolvimento em 7 Nov 2026:
- Homepage de desenvolvimento `index.html` usa `premium-preview.css` e está marcada `noindex,nofollow`; não é a homepage de produção.
- Páginas institucionais carregam entre 6 e 15 folhas CSS; há camadas base, premium, tipografia, cabeçalho, páginas específicas e unificação. Isto aumenta risco de cascata e divergência.
- `style.css` define azul principal `#0065cc`, navy `#062d56`, sky `#48baf5`, fundo `#f4f8fc`; `institutional-premium.css` e `premium-typography.css` já introduzem Instrument Sans, Manrope e IBM Plex Mono.
- As páginas Construction, Facilities, Supply e Business Services partilham parte do sistema, mas têm CSS específico adicional. Credibilidade, Parceiros, Portefólio e RFQ carregam combinações diferentes.
- A classe `hmatias-institutional` já é usada em páginas interiores. A aplicação precisa de ser progressiva, pois regras globais podem alterar componentes que já foram corrigidos.

## 9. Plano de implementação e aceitação
1. Centralizar tokens (feito nesta fase) sem redesenhar páginas.
2. Inventariar CSS por página e identificar regras duplicadas/contraditórias.
3. Normalizar cabeçalho, navegação, botões, tipografia e largura de conteúdo.
4. Aplicar primeiro à homepage de preview; comparar visualmente com a versão actual.
5. Replicar por grupos: páginas de serviços; páginas institucionais; catálogo/portefólio; RFQ.
6. Testar desktop 1440px, laptop 1280px, tablet 768px, mobile 390px e mobile estreito 360px; zoom 200%.
7. Verificar teclado, foco, contraste WCAG AA, reduced motion, links, formulários, imagens, consola e Core Web Vitals.
8. Não fazer merge/deploy de produção sem aprovação explícita.

## 10. Aplicação da fundação
O ficheiro `hm-design-system.css` foi ligado no fim do `<head>` das seguintes páginas de desenvolvimento: `index.html` (preview noindex), `premium-preview.html`, `construcao.html`, `facilities.html`, `supply.html`, `credibilidade.html`, `parceiros.html`, `servicos-administrativos.html`, `catalogo-obras.html`, `rfq.html` e `catalogo-fornecimentos.html`.
A folha centraliza tokens, foco visível de teclado e preferência de movimento reduzido. Não substitui nem apaga os CSS actuais; a adopção das variáveis nos componentes será gradual para evitar regressões.

### Verificação de contraste de pares de cor (texto normal em branco)
Medição matemática dos valores hexadecimais actuais:
- `#0065CC` sobre `#FFFFFF`: **5.62:1** — cumpre WCAG AA.
- `#062D56` sobre `#FFFFFF`: **13.84:1** — cumpre WCAG AAA.
- `#0B477C` sobre `#FFFFFF`: **9.52:1** — cumpre WCAG AAA.
- `#5D6D7D` sobre `#FFFFFF`: **5.32:1** — cumpre WCAG AA.
- `#48BAF5` sobre `#FFFFFF`: **2.18:1** — não usar para texto normal nem texto grande; reservar para detalhe decorativo ou fundos escuros após teste.

Estes valores verificam apenas os pares indicados, não todos os textos e fundos existentes nas páginas.

## 11. Limitações desta fase
A análise de páginas externas é uma avaliação de padrões observáveis e documentação pública, não uma auditoria técnica interna desses sites. A inspecção HMATIAS foi estática via ficheiros da branch; não substitui browser QA, Lighthouse ou teste real de submissões.
