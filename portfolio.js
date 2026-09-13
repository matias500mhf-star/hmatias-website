/* HMATIAS homepage portfolio data.
   To add or update a homepage project, edit the arrays below instead of changing the HTML cards manually.
   Keep descriptions factual and use only verified HMATIAS project images. */
(() => {
  'use strict';

  const grid = document.querySelector('.hmatias-home .project-grid');
  if (!grid) return;

  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const contactHref = isEn ? '#contact' : '#contacto';

  const projects = isEn ? [
    {
      id: 'project-01', webp: 'projeto-01.webp', fallback: 'projeto-01.jpg',
      alt: 'Concrete and paving work delivered by HMATIAS',
      label: 'Civil Construction · Real project',
      title: 'Concrete & Paving',
      description: 'Area preparation, concrete application and pavement finishing.'
    },
    {
      id: 'project-02', webp: 'projeto-02.webp', fallback: 'projeto-02.jpg',
      alt: 'Real HMATIAS poultry infrastructure project',
      label: 'Agriculture · Real project',
      title: 'Poultry Infrastructure',
      description: 'Execution and preparation of infrastructure supporting poultry production.'
    },
    {
      id: 'project-03', webp: 'projeto-03.webp', fallback: 'projeto-03.jpg',
      alt: 'Roofing and maintenance work delivered by HMATIAS',
      label: 'Construction · Maintenance · Real project',
      title: 'Roofing & Maintenance',
      description: 'Intervention and maintenance work on a roof structure.'
    },
    {
      id: 'project-04', webp: 'projeto-04.webp', fallback: 'projeto-04.jpg',
      alt: 'Real HMATIAS poultry production record',
      label: 'Agriculture · Real project',
      title: 'Poultry Operations',
      description: 'Operational record related to broiler production activity.'
    }
  ] : [
    {
      id: 'projeto-01', webp: 'projeto-01.webp', fallback: 'projeto-01.jpg',
      alt: 'Betonagem e pavimentação executadas pela HMATIAS',
      label: 'Construção Civil · Projeto real',
      title: 'Betonagem & Pavimentação',
      description: 'Preparação da área, aplicação de betão e acabamento de pavimento.'
    },
    {
      id: 'projeto-02', webp: 'projeto-02.webp', fallback: 'projeto-02.jpg',
      alt: 'Infraestrutura avícola real executada pela HMATIAS',
      label: 'Agropecuária · Projeto real',
      title: 'Infraestrutura Avícola',
      description: 'Execução e preparação de infraestrutura destinada ao apoio da produção avícola.'
    },
    {
      id: 'projeto-03', webp: 'projeto-03.webp', fallback: 'projeto-03.jpg',
      alt: 'Trabalho de cobertura e manutenção executado pela HMATIAS',
      label: 'Construção · Manutenção · Projeto real',
      title: 'Cobertura & Manutenção',
      description: 'Trabalho de intervenção e manutenção em estrutura de cobertura.'
    },
    {
      id: 'projeto-04', webp: 'projeto-04.webp', fallback: 'projeto-04.jpg',
      alt: 'Produção de frangos de corte em registo real da HMATIAS',
      label: 'Agropecuária · Projeto real',
      title: 'Operação Avícola',
      description: 'Registo real de atividade operacional relacionada com a produção de frangos de corte.'
    }
  ];

  const cards = [...grid.querySelectorAll('.project')];
  projects.forEach((project, index) => {
    const card = cards[index];
    if (!card) return;
    card.dataset.projectId = project.id;
    const source = card.querySelector('source[type="image/webp"]');
    const image = card.querySelector('.project-image');
    const label = card.querySelector('.project-caption small');
    const title = card.querySelector('.project-caption h3');
    const description = card.querySelector('.project-caption p');
    const link = card.querySelector('.project-caption a');
    if (source) source.srcset = project.webp;
    if (image) {
      image.src = project.fallback;
      image.alt = project.alt;
      image.loading = 'lazy';
      image.decoding = 'async';
    }
    if (label) label.textContent = project.label;
    if (title) title.textContent = project.title;
    if (description) description.textContent = project.description;
    if (link) link.href = contactHref;
  });
})();
