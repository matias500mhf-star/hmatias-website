(()=>{
  'use strict';
  const el=id=>document.getElementById(id);
  let token='';
  const base=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');
  const status=text=>{el('websiteLeadsStatus').textContent=text;};
  const item=(tag,text)=>{const x=document.createElement(tag);x.textContent=String(text??'');return x;};
  function clear(){
    token='';el('websiteLeadsToken').value='';
    el('websiteLeadsList').replaceChildren();
    el('websiteLeadDetail').textContent='Selecione um pedido depois da autenticação.';
    el('websiteLeadsCount').textContent='Sem dados';
    status('Sessão administrativa limpa.');
  }
  async function api(path,options={}){
    if(!token||!/^https:\/\//.test(base()))throw Error('Autenticação ou API indisponível.');
    const r=await fetch(base()+path,{
      ...options,cache:'no-store',
      headers:{authorization:'Bearer '+token,'content-type':'application/json',...(options.headers||{})},
      signal:AbortSignal.timeout(14000)
    });
    if(!r.ok)throw Error(r.status===401?'Credencial inválida.':'Consulta não disponível (HTTP '+r.status+').');
    return r.json();
  }
  async function show(id){
    el('websiteLeadDetail').textContent='A consultar informação reservada...';
    try{
      const data=await api('/api/admin/website-leads/'+encodeURIComponent(id));
      const d=data.lead||{},p=d.private||{};
      const lines=[
        'Referência: '+(d.reference||''),'Estado: '+(d.status||''),
        'Tipo: '+(d.kind||''),'Serviço: '+(d.service||''),
        'Criado em: '+(d.created_at||''),'Notificação: '+(d.alert_state||''),
        'Nome: '+(p.name||''),'Empresa: '+(p.company||''),
        'Telefone: '+(p.phone||''),'E-mail: '+(p.email||''),
        'Local: '+(p.location||''),'Descrição: '+(p.details||'')
      ];
      el('websiteLeadDetail').textContent=lines.join('\n');
      const choose=document.createElement('select');choose.setAttribute('aria-label','Alterar estado do pedido');
      for(const [value,label] of [['received','Recebido'],['triage','Em análise'],['responded','Respondido'],['closed','Encerrado']]){
        const opt=document.createElement('option');opt.value=value;opt.textContent=label;choose.append(opt);
      }
      choose.value=d.status||'received';
      const button=item('button','Atualizar estado');
      button.className='btn btn-primary btn-small';button.type='button';
      button.style.marginTop='16px';
      button.addEventListener('click',async()=>{
        button.disabled=true;
        try{
          await api('/api/admin/website-leads/'+encodeURIComponent(id)+'/status',{
            method:'POST',body:JSON.stringify({status:choose.value})
          });
          status('Estado comercial atualizado.');
          await list();
        }catch(error){status(error.message);}
        finally{button.disabled=false;}
      });
      el('websiteLeadDetail').append(document.createElement('hr'),choose,button);
    }catch(error){el('websiteLeadDetail').textContent=error.message;}
  }
  async function list(){
    const data=await api('/api/admin/website-leads');
    const rows=Array.isArray(data.results)?data.results:[];
    el('websiteLeadsCount').textContent=rows.length+' pedido(s) apresentados';
    const pending=Number(data.alerts?.pending||0),accepted=Number(data.alerts?.accepted||0);
    status(rows.length+' pedido(s). '+pending+' notificação(ões) pendente(s); '+accepted+' aceite(s) pelo serviço de email. Envio configurado: '+(data.delivery_configured===true?'sim':'não')+'.');
    const wrap=el('websiteLeadsList');wrap.replaceChildren();
    if(!rows.length){wrap.append(item('p','Sem pedidos institucionais registados nesta fila.'));return;}
    for(const row of rows){
      const card=document.createElement('article');card.className='lead-card';
      card.append(item('h3',row.reference+' · '+row.service));
      card.append(item('p',row.kind+' · Estado: '+row.status+' · Notificação: '+row.alert_state));
      card.append(item('small',row.created_at));
      const button=item('button','Consultar detalhes');button.className='btn btn-outline btn-small';button.type='button';
      button.addEventListener('click',()=>show(row.id));
      card.append(document.createElement('div'),button);
      wrap.append(card);
    }
  }
  el('websiteLeadsLogin').addEventListener('click',async()=>{
    token=el('websiteLeadsToken').value.trim();el('websiteLeadsToken').value='';
    if(!token){status('Introduza o token administrativo.');return;}
    status('A validar acesso...');
    try{await list();}catch(error){clear();status(error.message);}
  });
  el('websiteLeadsClear').addEventListener('click',clear);
  window.addEventListener('pagehide',()=>{token='';});
})();
