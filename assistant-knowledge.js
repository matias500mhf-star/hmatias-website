/* HMATIAS Assistant — central official knowledge base.
   Source of truth: current public HMATIAS website content, 2026-09-15. */
(() => {
  'use strict';

  const cleanCatalog = [
    ['T215','Bundu Lodge','Cozinha / Kitchen'],['T415','Tauradish','Cozinha / Kitchen'],['T518','Dish Ninja','Cozinha / Kitchen'],['T315','Biodish','Cozinha / Kitchen'],['T416','Taurasparkle','Cozinha / Kitchen'],['T720','Machine Dishwasher Powder','Cozinha / Kitchen'],['T815','Chlorinated Machine Dishwasher Liquid','Cozinha / Kitchen'],['T718','Rinse Aid','Cozinha / Kitchen'],['03-150','Industrial Vinegar','Cozinha / Multiuso'],['T517','Shabba Delight','Cozinha / Kitchen'],['T417','Tauroven','Cozinha / Kitchen'],['T401','Taura Scoura','Cozinha / Kitchen'],['T611','Handi Clean Lemon','Cozinha / Multiuso'],['T452','Mitsuki','Multiuso / Manutenção'],
    ['T563P','Pine Gel','Multiuso'],['T419','Super 8','Multiuso'],['T772','Green Lemon','Multiuso / Pisos'],['T616','Cleanall','Multiuso'],['T418','St Anna’s','Multiuso'],['T749','Clear Views','Janelas'],['T849','Blue Skies','Janelas'],['T466','Tauracidal','Desinfeção'],['T463P','Tauratol','Desinfeção / Washroom'],['T467','Anti-Mould','Desinfeção'],['T566','Active Blue','Desinfeção'],['T929','Liquidator','Desinfeção'],['T438','Taurbleach','Desinfeção / Tecidos'],['T538','Thick Bleach','Desinfeção'],
    ['T426','Liquid Hand Soap','Higiene'],['T427','Lavender Hand Soap','Higiene'],['T428','Tauraseptic','Higiene'],['T429','Tauraseptic Clear','Higiene'],['T422','Super Gold','Higiene'],['T423','Nu Grid','Higiene'],['24-SOAP','Pearl Shower Gel','Higiene'],['T529','Magic Touch','Higiene'],['T729','Liquisan Plus','Higiene'],['T629','Liquiglove','Higiene'],['T461','Taurinal','Washroom'],['T462','Taurpine','Washroom'],['T763P','Green Dream Bathroom Vision','Washroom'],
    ['T608','Fantabulous','Lavandaria'],['T410','Easy Wash','Lavandaria'],['T808','Power Bright Apple','Lavandaria'],['T510','Flutterby Laundry','Lavandaria'],['T408','Power Bright','Lavandaria'],['T409','Hypawash','Lavandaria'],['T509','High Foam Hand Wash','Lavandaria'],['T395','Yummy Citrus','Ambiente'],['T400','Cherry Air Freshener','Ambiente'],['15-BDI','Bio-Organic Odour Killer','Ambiente'],['T547','Flutterby Fabric Softener','Tecidos'],['T433','Flower Power','Tecidos / Pisos'],['T650','Double D','Tecidos / Pisos'],['T747','Bunny Soft','Tecidos'],
    ['T446','Car Wash Red','Automóvel'],['T550','Fleet Wash','Automóvel'],['T556','Happy Car','Automóvel'],['T450','TNT','Automóvel'],['76-D02','Silprolease','Automóvel'],['76-D01','Silprolease Citrus','Automóvel'],['20-1307','Black Tyre Polish','Automóvel'],['T449','Tyre Gloss','Automóvel'],['T534','Tar Remover','Automóvel'],['T634','Cream Tar Remover','Automóvel'],['T448','Tyre Glide','Automóvel'],['T432','Safetysolv','Automóvel'],['T431/8','Solvent Based Engine Cleaner','Automóvel'],['T444','Triple Four','Automóvel'],
    ['T412','Tauralum','Manutenção'],['T454','Treat','Manutenção'],['T456','Taurment','Manutenção'],['22-512','Penet Oil','Manutenção'],['20-1505','Teak Oil','Manutenção'],['22-734','Anti-Sieze Copper Paste','Manutenção'],['03-008','Battery Water','Manutenção'],['03-004','Battery Acid','Manutenção'],['03-048','Pool Acid','Piscinas'],['15-HTH','HTH','Piscinas'],['T503','Easy Flow','Drenagem'],['T603','Free Flow','Drenagem'],['T464','Taurdrain','Drenagem'],['15-B03','Bioflow','Drenagem'],['15-B01','Breakdown','Drenagem'],['T465','Taurasan Blue','Drenagem'],['15-BIOCHEM','Chemtreat','Drenagem'],
    ['T470','Floor Fresh Lavender','Pisos'],['T505','Low Foam Neutral Detergent','Pisos'],['T434','Taurdegreaser','Pisos'],['T430','Floor Degreasing Powder','Pisos'],['T406','Carpet Glow','Carpetes'],['T605','Lemon Breeze','Carpetes'],['T499','Taurafloor','Pisos'],['T1000','Mirror Floor','Pisos'],['T2000','Ultra Polish','Pisos'],['20-1100','Liquid Wax Polish','Pisos'],['20-1305','White Wax Polish','Pisos'],['T3000','UV Resistant Sealer','Pisos'],['T598','Taurastrip Blue','Pisos'],['T498','Wax Off','Pisos']
  ];

  const kb = {
    version: '2026-09-15.1',
    updated: '2026-09-15',
    company: {
      name: 'HMATIAS – Prestação de Serviços SU, LDA', shortName: 'HMATIAS',
      location: 'Viana, Bairro 1 de Maio, Casa n.º 31, Luanda – Angola',
      phone: '+244 948 806 673', whatsapp: '+244 948 806 673',
      emailGeneral: 'geral@hmatiasps.ao', emailCommercial: 'comercial@hmatiasps.ao',
      nif: '5001578065', commercialRegistration: '24.094-23', registrationNumber: '24094-23/230713'
    },
    leadership: {
      name: 'Henrique Matias',
      titlePt: 'Sócio Único, CEO & Managing Director',
      titleEn: 'Sole Shareholder, CEO & Managing Director',
      summaryPt: 'Henrique Matias é o Sócio Único, CEO & Managing Director da HMATIAS – Prestação de Serviços, SU, LDA. Lidera a estratégia, o desenvolvimento comercial e a coordenação das operações da empresa, com foco em soluções práticas e eficientes para clientes e parceiros.',
      summaryEn: 'Henrique Matias is the Sole Shareholder, CEO & Managing Director of HMATIAS – Prestação de Serviços, SU, LDA. He leads the company’s strategy, business development and operational coordination, with a focus on practical and efficient solutions for clients and partners.'
    },
    pages: {
      home: '/', construction: '/construcao.html', facilities: '/facilities.html', supply: '/supply.html', clean: '/clean.html', business: '/servicos-administrativos.html', booking: '/agendamento.html', privacy: '/privacidade.html', terms: '/termos.html',
      homeEn: '/en.html', constructionEn: '/construction.html', facilitiesEn: '/facilities-en.html', supplyEn: '/supply-en.html', cleanEn: '/clean-en.html', businessEn: '/business-services.html', bookingEn: '/booking.html', privacyEn: '/privacy.html', termsEn: '/terms.html'
    },
    construction: {
      summaryPt: 'Construção civil e infraestrutura para empresas, instituições e projetos, com escopo claro, organização no terreno e acompanhamento até à entrega.',
      summaryEn: 'Civil construction and infrastructure for companies, institutions and projects, with clear scope, organised site execution and follow-through to delivery.',
      capabilitiesPt: ['Betonagem e pavimentação','Infraestrutura e estruturas','Estruturas e coberturas','Remodelação de escritórios, instalações, espaços residenciais e áreas empresariais','Revestimentos e acabamentos','Adaptação de espaços'],
      processPt: ['Levantamento da necessidade, localização, fotografias e medidas','Proposta com escopo, materiais, prazo e condições','Execução e acompanhamento até à entrega']
    },
    facilities: {
      summaryPt: 'Manutenção, limpeza/conservação e apoio operacional para instalações empresariais, com frequência, áreas, recursos e responsabilidades definidos em escopo.',
      summaryEn: 'Maintenance, cleaning/upkeep and operational support for business facilities under an agreed scope and frequency.',
      capabilitiesPt: ['Manutenção de instalações','Intervenções pontuais','Limpeza e conservação','Rotinas conforme frequência acordada','Apoio operacional','Levantamento e acompanhamento de necessidades'],
      processPt: ['Diagnóstico da necessidade e prioridade','Plano de serviço com escopo, responsabilidades, recursos e frequência','Execução ou coordenação e acompanhamento']
    },
    supply: {
      summaryPt: 'Procurement, sourcing e fornecimento empresarial orientados por referência, especificação, quantidade, origem, logística e prazo.',
      summaryEn: 'Procurement, sourcing and business supply guided by reference, specification, quantity, origin, logistics and target date.',
      capabilitiesPt: ['Sourcing nacional','Pesquisa regional na África Austral','Fornecimento internacional','Materiais, consumíveis, produtos e equipamentos','Pesquisa e comparação de alternativas'],
      processPt: ['Especificação do produto/referência, quantidade, local e prazo','Pesquisa e comparação de opções, disponibilidade, origem e logística','Cotação com preço, prazo, condições e validade'],
      rulePt: 'Marcas, fornecedores e contactos de terceiros são referenciados apenas quando relevantes; isso não implica representação, exclusividade ou parceria institucional.'
    },
    clean: {
      summaryPt: 'Produtos de limpeza e higiene para utilização doméstica e profissional. Produtos fornecidos sob encomenda; stock, prazo e entrega ficam sujeitos a confirmação comercial.',
      summaryEn: 'Cleaning and hygiene products for domestic and professional use. Products are supplied on order; stock, lead time and delivery are subject to commercial confirmation.',
      featured: {
        pine500: {name:'123 Pine Gel',format:'500 ml',price:'Sob consulta',status:'Sob encomenda',descriptionPt:'Gel de limpeza multiusos para utilização doméstica e profissional. Consulte e respeite sempre as instruções do rótulo.'},
        taurusPine: {code:'T563P',name:'Taurus Pine Gel',formats:{'500 g':'Sob consulta','1 kg':'8.500 Kz','5 kg':'26.500 Kz','20 kg':'94.000 Kz'},status:'Sob encomenda',descriptionPt:'Gel multiuso com ação germicida, indicado para remoção de sujidade, manchas, gordura e odores em diversas superfícies.',featuresPt:'Gel verde, odor a pinho, pH 7, completamente solúvel e biodegradável.',applicationsPt:['Cerâmica de banho','Sanitas','Lavatórios','Pias','Pisos','Carpetes','Estofos'],dilutionsPt:['Pisos e banheiras/lavatórios 1:25','Carpetes aproximadamente 1:10','Vinil aproximadamente 1:20'],warningPt:'O fabricante não aconselha a utilização em superfícies em contacto com alimentos.'}
      },
      catalogNotePt: 'O catálogo profissional inclui produtos por código e categoria. Para produtos sem preço publicado, o assistente nunca deve inventar preço, formato, stock, prazo ou condições de entrega; deve encaminhar para confirmação comercial.',
      brandNotePt: 'A referência à Taurus identifica produtos do fabricante e não implica representação exclusiva, parceria ou exclusividade comercial.', cleanCatalog
    },
    businessServices: {
      summaryPt: 'Apoio administrativo, documental e empresarial para profissionais, empreendedores e empresas, presencial em Luanda e remoto quando aplicável.',
      pricesPt: [['Expediente Administrativo & Redação Institucional','Desde 5.000 Kz'],['Estruturação de CV Profissional','Desde 10.000 Kz'],['Gestão & Organização Documental','Desde 10.000 Kz'],['Propostas Comerciais & Business Support','Desde 15.000 Kz'],['Apresentações Empresariais','Desde 20.000 Kz'],['Apoio Administrativo Recorrente para PME','Desde 75.000 Kz/mês'],['Apoio Administrativo a Processos de Visto & Agendamentos Consulares','Sob consulta']],
      pricingRulePt: 'Os valores são preços base. Volume, complexidade, urgência e prazo podem alterar o orçamento final, que é confirmado antes da execução.',
      visaPt: 'Inclui checklist e organização documental, conferência de completude do dossier, assistência administrativa no preenchimento de formulários, apoio na utilização de plataformas oficiais, preparação do dossier e acompanhamento administrativo.',
      visaLimitsPt: 'A HMATIAS presta apenas apoio administrativo e documental. Não comercializa vagas de agendamento, não garante disponibilidade de marcação ou concessão de visto e não possui acesso privilegiado a embaixadas, consulados, VFS Global ou outras plataformas oficiais. Taxas consulares/VFS e outros encargos oficiais não estão incluídos salvo indicação expressa. Serviços jurídicos e representação legal não fazem parte desta oferta.'
    },
    booking: {summaryPt:'O agendamento do site é um pedido de atendimento HMATIAS. Pode ser presencial em Luanda ou remoto quando aplicável. O horário é sempre sujeito a confirmação da equipa.',rulesPt:['Não existe disponibilidade em tempo real','O formulário não confirma automaticamente data ou hora','Não processa pagamentos online','A marcação só fica confirmada após resposta expressa da HMATIAS','Uma marcação HMATIAS não é uma vaga consular, VFS ou embaixada e não garante visto ou agendamento oficial']},
    projects: {publicExamplesPt:['Betonagem & Pavimentação','Infraestrutura Avícola','Cobertura & Manutenção','Operação Avícola'],disclosurePt:'Cliente, data e localização de projetos são identificados publicamente apenas quando a divulgação é adequada ou autorizada.'},
    safetyAndTruth: {rulesPt:['Nunca inventar preço, stock, disponibilidade, prazo, parceria, representação, garantia ou capacidade não publicada.','Quando um preço não está publicado, dizer “sob consulta” e indicar o contacto comercial.','Para obras, facilities e supply, explicar que escopo/preço dependem de levantamento, especificação e cotação.','Não pedir nem incentivar envio de passaporte, BI, palavras-passe, dados bancários ou outros documentos sensíveis no assistente.','Não afirmar que uma vaga consular, aprovação de visto, horário ou pagamento está confirmado sem resposta expressa da HMATIAS/entidade competente.','Responder no idioma do utilizador sempre que possível; PT e EN são suportados.']}
  };

  const compactContext = () => {
    const c = kb.company, p = kb.clean.featured.taurusPine;
    return [
      `KNOWLEDGE_VERSION: ${kb.version}`,
      `EMPRESA: ${c.name}; sede ${c.location}; tel/WhatsApp ${c.phone}; emails ${c.emailGeneral}, ${c.emailCommercial}; NIF ${c.nif}; Registo Comercial ${c.commercialRegistration}; Matrícula ${c.registrationNumber}.`,
      `LIDERANÇA / LEADERSHIP: ${kb.leadership.summaryPt} English: ${kb.leadership.summaryEn}`,
      `CONSTRUÇÃO: ${kb.construction.summaryPt} Capacidades: ${kb.construction.capabilitiesPt.join('; ')}. Processo: ${kb.construction.processPt.join('; ')}.`,
      `FACILITIES: ${kb.facilities.summaryPt} Capacidades: ${kb.facilities.capabilitiesPt.join('; ')}.`,
      `SUPPLY: ${kb.supply.summaryPt} Capacidades: ${kb.supply.capabilitiesPt.join('; ')}. ${kb.supply.rulePt}`,
      `CLEAN: ${kb.clean.summaryPt} 123 Pine Gel 500 ml: preço sob consulta. Taurus Pine Gel T563P: ${p.descriptionPt} ${p.featuresPt} Formatos/preços: 500 g sob consulta; 1 kg 8.500 Kz; 5 kg 26.500 Kz; 20 kg 94.000 Kz. Aplicações: ${p.applicationsPt.join(', ')}. Diluições: ${p.dilutionsPt.join('; ')}. Aviso: ${p.warningPt} ${kb.clean.brandNotePt}`,
      `CATÁLOGO CLEAN: ${cleanCatalog.map(x=>`${x[0]} ${x[1]} [${x[2]}]`).join('; ')}. Para estes itens, se não houver preço publicado, confirmar com equipa comercial.`,
      `BUSINESS SERVICES: ${kb.businessServices.pricesPt.map(x=>`${x[0]} — ${x[1]}`).join('; ')}. ${kb.businessServices.pricingRulePt} Vistos/agendamentos: ${kb.businessServices.visaLimitsPt}`,
      `AGENDAMENTO HMATIAS: ${kb.booking.summaryPt} ${kb.booking.rulesPt.join('; ')}.`,
      `PROJETOS PÚBLICOS: ${kb.projects.publicExamplesPt.join('; ')}. ${kb.projects.disclosurePt}`,
      `REGRAS DE VERDADE: ${kb.safetyAndTruth.rulesPt.join(' ')}.`,
      `PÁGINAS: construção ${kb.pages.construction}; facilities ${kb.pages.facilities}; supply ${kb.pages.supply}; clean ${kb.pages.clean}; business ${kb.pages.business}; agendamento ${kb.pages.booking}.`
    ].join('\n');
  };

  kb.toAssistantContext = compactContext;
  Object.freeze(kb.company);
  Object.freeze(kb.leadership);
  window.HMATIAS_KNOWLEDGE = kb;
})();