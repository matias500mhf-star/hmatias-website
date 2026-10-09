(()=>{
  'use strict';
  const byId=id=>document.getElementById(id);
  const form=byId('discoveryForm'),query=byId('discoveryQuery'),token=byId('discoveryToken');
  const submit=byId('discoverySubmit'),status=byId('discoveryStatus'),results=byId('discoveryResults'),info=byId('resultsInfo');
  const MARKETS={AO:'Angola',NA:'Namíbia',ZA:'África do Sul'};
  const safeUrl=url=>{
    try{const x=new URL(url);return x.protocol==='https:'?x.href:null;}catch{return null;}
  };
  function node(name,value,className=''){
    const el=document.createElement(name);
    if(className)el.className=className;
    el.textContent=String(value||'');
    return el;
  }
  byId('clearDiscovery').addEventListener('click',()=>{
    token.value='';query.value='';results.replaceChildren();
    info.textContent='Sessão limpa. Nenhuma credencial foi guardada.';
    status.textContent='Pronto para introduzir credenciais.';
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const markets=[...form.querySelectorAll('input[name="markets"]:checked')].map(i=>i.value);
    if(!markets.length){status.textContent='Selecione pelo menos um país.';return;}
    const api=window.SOURCE_AO_RUNTIME?.apiBase||'';
    const apiUrl=safeUrl(api);
    if(!apiUrl){status.textContent='API Source AO indisponível nesta página.';return;}
    submit.disabled=true;status.textContent='A consultar fontes públicas...';
    results.replaceChildren();
    try{
      const response=await fetch(apiUrl.replace(/\/$/,'')+'/api/admin/supplier-discovery',{
        method:'POST',cache:'no-store',
        headers:{'content-type':'application/json','authorization':'Bearer '+token.value},
        body:JSON.stringify({query:query.value,markets}),
        signal:AbortSignal.timeout(35000)
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error?.message||'Pedido rejeitado pelo servidor.');
      const rows=Array.isArray(data.candidates)?data.candidates:[];
      info.textContent=`${rows.length} fontes potenciais identificadas. Pesquisa: ${data.search_status}. Análise IA: ${data.ai_status}. Nenhum resultado confirma preço, stock ou compatibilidade.`;
      for(const result of rows){
        const article=document.createElement('article');article.className='discovery-result';
        article.append(node('h3',result.source_title));
        const region=node('small','Mercado pesquisado: '+(MARKETS[result.market_searched]||'não identificado'));article.append(region);
        const href=safeUrl(result.source_url);
        if(href){
          const a=document.createElement('a');
          a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=href;
          article.append(a);
        }
        article.append(node('p',result.source_snippet||'Sem descrição pública.'));
        if(result.ai_assessment){
          article.append(node('p','Análise de relevância: '+result.ai_assessment.fit+' — '+result.ai_assessment.reason));
        }
        article.append(node('small','Fornecedor potencial — especificação, localização, preço, certificados e disponibilidade por confirmar.'));
        results.append(article);
      }
      status.textContent='Pesquisa concluída. Verificar fontes antes de contactar.';
    }catch(error){
      info.textContent='Sem resultados disponíveis.';
      status.textContent=error instanceof Error?error.message:'Falha de pesquisa.';
    }finally{submit.disabled=false;}
  });
})();
