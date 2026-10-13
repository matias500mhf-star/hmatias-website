const unique=values=>[...new Set(values.filter(Boolean))];
const matches=(text,pattern)=>[...text.matchAll(pattern)].map(row=>row[0].trim());
const key=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/×/g,'x').replace(/[^a-z0-9]/g,'');

// Preserve what the requester wrote. These are requirements, not verified offers.
export function technicalRequirement(query=''){
  const text=String(query).trim();
  const standards=unique(matches(text,/\b(?:ASTM|ISO|DIN|EN)\s*(?:[A-Z]\s*)?\d{2,6}(?:[.-]\d+)?\b/gi));
  const grades=unique(matches(text,/\b(?:grade|grau|class|classe)\s+[A-Z0-9]+\b/gi));
  const chemicalIds=unique(matches(text,/\b(?:CAS\s*)?\d{2,7}-\d{2}-\d\b/gi));
  const percentages=unique(matches(text,/\b\d+(?:[.,]\d+)?\s*%/g));
  const dimensions=unique(matches(text,/\bM\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*mm)?\b/gi));
  const measures=unique(matches(text,/\b\d+(?:[.,]\d+)?\s*(?:mm|cm|ml|kg|lbs?|kw|kva|btu|psi|hz|m|l|g|v|w)\b/gi));
  const models=unique([
    ...matches(text,/\bCV\s*\d+\/\d+\s*(?:Adv)?\b/gi),
    ...matches(text,/\b[A-Z]{2,6}[-]?\d{3,8}(?:[-/][A-Z0-9]+)?\b/gi)
      .filter(value=>!standards.some(standard=>key(standard).includes(key(value)))),
    ...[...text.matchAll(/\b(?:modelo|model|refer[eê]ncia|reference)\s*[:#]?\s*([A-Z0-9][A-Z0-9._/-]*\d[A-Z0-9._/-]*)\b/gi)].map(row=>row[1])
  ]);
  const count=text.match(/\b(\d+(?:[.,]\d+)?)\s*(rolos?|rolls?|unidades?|units?|pcs?|peças?|pecas?)\b/i);
  const quantity=count?{value:Number(count[1].replace(',','.')),unit:/^(rolo|roll)/i.test(count[2])?'rolo':'un',text:count[0]}:null;
  const strict=/\b(?:sem alternativas|sem equivalentes|refer[eê]ncia exata|exact reference only|no alternatives|no substitutes)\b/i.test(text);
  return {query:text,models,standards,grades,chemicalIds,percentages,dimensions,measures,quantity,strict,specifications:unique([...models,...standards,...grades,...chemicalIds,...percentages,...dimensions,...measures])};
}

export function matchesTechnicalRequirement(item,requirement){
  const references=[...requirement.standards,...requirement.grades,...requirement.chemicalIds,...requirement.percentages,...requirement.dimensions,...requirement.measures];
  const description=[item?.name,item?.specification,item?.brand,item?.model].filter(Boolean).join(' ');
  const available=key(description);
  const modelsMatch=requirement.models.every(model=>{
    const parts=model.match(/[A-Z]+|\d+/gi)||[];
    return new RegExp('\\b'+parts.join('[\\s./_-]*')+'\\b','i').test(description);
  });
  // A category observation cannot verify a different model, standard or dimension.
  return modelsMatch&&references.every(reference=>available.includes(key(reference)));
}

export function technicalRfq(requirement,{lang='pt',location='Luanda',quantity='',neededBy=''}={}){
  const pt=lang==='pt';
  const inferred=requirement.quantity;
  const unit=inferred?.unit==='rolo'?(pt?'rolo(s)':'roll(s)'):inferred?.unit==='un'?(pt?'un':'units'):'';
  const qty=quantity!==''&&quantity!=null?String(quantity)+(unit?` ${unit}`:''):inferred?(pt?inferred.text:`${inferred.value} ${unit}`):(pt?'a confirmar':'to confirm');
  const specs=requirement.specifications.join(', ')||(pt?'conforme descrição do pedido':'as described in the request');
  const deadlines={urgent:pt?'urgente, prazo a confirmar':'urgent, lead time to confirm',planned:pt?'programado, data a confirmar':'planned, date to confirm',week:pt?'esta semana, data a confirmar':'this week, date to confirm'};
  const deadline=deadlines[neededBy==='this week'?'week':neededBy]|| (neededBy&&neededBy!=='normal'?neededBy:(pt?'a confirmar':'to confirm'));
  return pt?[
    'Boa tarde.',
    'Solicitamos confirmação de disponibilidade e cotação para:',
    `Produto: ${requirement.query}`,`Especificação / referência: ${specs}`,
    `Quantidade: ${qty}`,`Destino: ${location}`,`Necessidade: ${deadline}`,'',
    'Confirme a referência exata, stock atual, preço, unidade/embalagem, documentação técnica e prazo de entrega.',
    requirement.strict?'Não são aceites alternativas. Se a referência não estiver disponível, indique a indisponibilidade.':'Qualquer alternativa deve ser identificada separadamente e aprovada antes de substituir a referência pedida.'
  ].join('\n'):[
    'Good afternoon.',
    'Please confirm availability and quotation for:',
    `Product: ${requirement.query}`,`Specification / reference: ${specs}`,
    `Quantity: ${qty}`,`Destination: ${location}`,`Required: ${deadline}`,'',
    'Confirm the exact reference, current stock, price, unit/packaging, technical documentation and delivery lead time.',
    requirement.strict?'No alternatives are accepted. If the reference is unavailable, state that it is unavailable.':'Identify any alternative separately and obtain approval before substituting the requested reference.'
  ].join('\n');
}
