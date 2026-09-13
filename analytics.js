/* HMATIAS shared bootstrap + Google Analytics 4. */
(() => {
  'use strict';

  const addInstagramLink = () => {
    document.querySelectorAll('.header-social').forEach(group => {
      if (group.querySelector('[data-hmatias-instagram]')) return;
      const link = document.createElement('a');
      link.href = 'https://www.instagram.com/hmatias_pslda/';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'Instagram — HMATIAS');
      link.dataset.hmatiasInstagram = 'true';
      const icon = document.createElement('img');
      icon.src = 'images/social-instagram.svg';
      icon.width = 18;
      icon.height = 18;
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      link.appendChild(icon);
      group.appendChild(link);
    });
  };

  /*
   * Keep the homepage portfolio aligned with the verified institutional
   * project mapping used by HMATIAS:
   * 01 = betonagem/pavimentação
   * 02 = infraestrutura avícola
   * 03 = cobertura/manutenção
   * 04 = produção avícola
   *
   * The service pages already use project-01 for Construction and
   * project-03 for Facilities. This correction prevents project-03 from
   * being presented as an aviculture image on the homepage.
   */
  const alignHomepageProjectMedia = () => {
    const grid = document.querySelector('.hmatias-home .project-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.project');
    if (cards.length < 4) return;

    const isEnglish = (document.documentElement.lang || '').toLowerCase().startsWith('en');

    const applyProject = (card, data) => {
      const source = card.querySelector('picture source[type="image/webp"]');
      const image = card.querySelector('.project-image');
      const label = card.querySelector('.project-caption small');
      const title = card.querySelector('.project-caption h3');
      const description = card.querySelector('.project-caption p');

      if (source) source.srcset = data.webp;
      if (image) {
        image.src = data.fallback;
        image.alt = data.alt;
      }
      if (label) label.textContent = data.label;
      if (title) title.textContent = data.title;
      if (description) description.textContent = data.description;
    };

    if (isEnglish) {
      applyProject(cards[1], {
        webp: 'projeto-02.webp',
        fallback: 'projeto-02.jpg',
        alt: 'Real HMATIAS poultry infrastructure project',
        label: 'Agriculture · Real project',
        title: 'Poultry Infrastructure',
        description: 'Execution and preparation of infrastructure supporting poultry production.'
      });
      applyProject(cards[2], {
        webp: 'projeto-03.webp',
        fallback: 'projeto-03.jpg',
        alt: 'Roofing and maintenance work delivered by HMATIAS',
        label: 'Construction · Maintenance · Real project',
        title: 'Roofing & Maintenance',
        description: 'Intervention and maintenance work on a roof structure.'
      });
    } else {
      applyProject(cards[1], {
        webp: 'projeto-02.webp',
        fallback: 'projeto-02.jpg',
        alt: 'Infraestrutura avícola real executada pela HMATIAS',
        label: 'Agropecuária · Projeto real',
        title: 'Infraestrutura Avícola',
        description: 'Execução e preparação de infraestrutura destinada ao apoio da produção avícola.'
      });
      applyProject(cards[2], {
        webp: 'projeto-03.webp',
        fallback: 'projeto-03.jpg',
        alt: 'Trabalho de cobertura e manutenção executado pela HMATIAS',
        label: 'Construção · Manutenção · Projeto real',
        title: 'Cobertura & Manutenção',
        description: 'Trabalho de intervenção e manutenção em estrutura de cobertura.'
      });
    }
  };

  const bootstrapSharedUi = () => {
    addInstagramLink();
    alignHomepageProjectMedia();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapSharedUi, { once: true });
  } else {
    bootstrapSharedUi();
  }

  const measurementId = 'G-JNJDL6LZFY';
  const productionHosts = ['comercialhmatiasps.com', 'www.comercialhmatiasps.com'];
  if (!productionHosts.includes(window.location.hostname)) return;
  if (document.querySelector('script[data-hmatias-analytics]')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  tag.dataset.hmatiasAnalytics = measurementId;
  document.head.appendChild(tag);
})();