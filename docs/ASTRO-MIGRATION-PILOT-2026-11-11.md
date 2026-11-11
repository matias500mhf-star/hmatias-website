# HMATIAS — Piloto de migração incremental para Astro

**Data:** 11 de novembro de 2026  
**Branch:** `feat/hmatias-platform-modernization-20261111`  
**Estado:** primeiro protótipo modular criado; validação CI em curso.

## Decisão

A primeira experiência de arquitetura é construída com Astro em modo estático. A homepage aprovada é reproduzida num projeto autónomo, fora do publisher de produção. O objectivo é comparar uma saída Astro com a estrutura HTML/CSS/JS existente antes de decidir qualquer migração.

Foi escolhida a versão Astro 7.4.8, versão estável mais recente consultada em 11 de Novembro de 2026. Astro 7.4 elevou o mínimo suportado para Node.js 22.22.0; por isso, o ambiente automatizado usa Node.js 24.

Referências:
- [Astro 7.4.8 no npm](https://www.npmjs.com/package/astro)
- [Astro 7.4 — requisitos de Node](https://astro.build/blog/astro-740/)
- [Estrutura recomendada de projeto Astro](https://docs.astro.build/en/basics/project-structure/)

## O que está no protótipo

- Layout base com metadados e política de não indexação.
- Cabeçalho navegável e acessível.
- Serviços alimentados por dados TypeScript tipados.
- Galeria de projectos com imagens importadas do repositório e processamento do Astro.
- Secção de contactos com telefone, WhatsApp, e-mail comercial, e-mail institucional e morada.
- Rodapé simples, coerente com a primeira proposta aprovada.
- Design tokens alinhados com o azul institucional e tipografia Inter local.
- Verificação automática da saída estática e dos elementos essenciais.

## Tratamento das fotografias

As fotografias são importadas como activos locais e processadas no build. O layout preserva a proporção intrínseca, usando dimensões responsivas e sem uma altura de cartão forçada. Nenhuma fotografia é cortada para uniformizar o mosaico.

A imagem principal usa uma moldura 4:3 com comportamento `contain`; a galeria usa altura natural derivada das dimensões originais.

## Separação de responsabilidades

- Astro serve páginas institucionais e conteúdo estático.
- React não foi instalado nesta primeira fase. Será introduzido apenas onde o Smart RFQ demonstrar necessidade de interação de estado mais complexa.
- TypeScript já é usado para tipar a estrutura de serviços, projectos e contactos.
- SOURCE AO, lead intake e assistente continuam nos seus Workers e contratos actuais.

## Validação planeada

O workflow `.github/workflows/astro-prototype-qa.yml` instala dependências em Node 24, executa `npm audit --audit-level=high`, `astro check`, `astro build` e valida a saída HTML/activos. O artefacto fica disponível durante sete dias no próprio run do GitHub Actions.

## Fronteira de segurança

Este piloto não altera `main`, não abre pull request, não altera DNS, não associa domínios e não substitui GitHub Pages. Só pode ser considerado candidato após comparação visual, SEO, acessibilidade, performance, formulários, analytics, consentimento e integrações.
