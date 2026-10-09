import {decryptPrivateText} from './sourcing.js';

/* Durable private notification outbox. Pending until explicit Resend configuration.
 * A successful D1 INSERT does not mean the team was notified.
 */
const clip=(v,len=1800)=>String(v??'').trim().slice(0,len);
export function deliveryReady(env){
  return Boolean(env?.SOURCE_AO_DB&&env?.RESEND_API_KEY&&env?.SOURCE_AO_ALERT_FROM&&env?.SOURCE_AO_ALERT_TO&&env?.PII_ENCRYPTION_KEY);
}
export function retryMinutes(attempts){return Math.min(1440,Math.round(5*2**Math.min(8,Math.max(0,attempts-1))));}
export function alertText(type,row,privateContact){
  const lines=type==='sourcing_request'?[
    'HMATIAS / SOURCE AO — NOVO PEDIDO DE SOURCING',
    'Referência: '+clip(row.public_ref,100),'Item: '+clip(row.requirement_text,240),
    'Especificação: '+clip(row.specification,300),
    'Quantidade: '+(row.quantity??'A confirmar'),'Unidade: '+clip(row.unit||'A confirmar',40),
    'Local: '+clip(row.location,100),'Prioridade/prazo: '+clip(row.needed_by||'Normal',40),
    'Contacto: '+clip(privateContact,180),'Estado: '+clip(row.status,40)
  ]:[
    'HMATIAS / SOURCE AO — NOVA CANDIDATURA DE PARCERIA',
    'Referência: '+clip(row.reference,100),'Empresa: '+clip(row.company_name,200),
    'Tipo: '+clip(row.partner_type,50),'Local: '+clip(row.locality,100),
    'Contacto e detalhes: '+clip(privateContact,1000),
    'Estado: '+clip(row.status,40)
  ];
  return lines.join('\n')+'\n\nAção: consultar a área privada Source AO, validar requisitos e definir responsável comercial. A receção não confirma disponibilidade, cotação ou aceitação da parceria.';
}
async function loadAlertData(env,alert){
  if(alert.source_type==='sourcing_request'){
    const row=await env.SOURCE_AO_DB.prepare('SELECT * FROM sourcing_requests WHERE id=?').bind(alert.source_id).first();
    if(!row)return null;
    const contact=await decryptPrivateText(row.contact_encrypted,env.PII_ENCRYPTION_KEY);
    return {row,contact};
  }
  if(alert.source_type==='partner_application'){
    const row=await env.SOURCE_AO_DB.prepare('SELECT * FROM partner_applications WHERE id=?').bind(alert.source_id).first();
    if(!row)return null;
    const profile=JSON.parse(await decryptPrivateText(row.private_profile_ciphertext,env.PII_ENCRYPTION_KEY));
    const contact=['Responsável: '+clip(profile.contact_name,120),'E-mail: '+clip(profile.email,180),'WhatsApp: '+clip(profile.whatsapp,100),
      'Registo: '+clip(profile.registration_number,80),'Observações: '+clip(profile.note,800)].join('\n');
    return {row,contact};
  }
  return null;
}
export async function sendPendingIntakeAlerts(env,{limit=8,now=new Date()}={}){
  if(!deliveryReady(env))return {configured:false,processed:0,sent:0,failed:0};
  const db=env.SOURCE_AO_DB;
  const rows=await db.prepare("SELECT * FROM intake_alerts WHERE state='pending' AND datetime(next_attempt_at)<=datetime(?) ORDER BY created_at ASC LIMIT ?")
    .bind(now.toISOString(),Math.max(1,Math.min(20,limit))).all();
  let sent=0,failed=0;
  for(const alert of rows.results||[]){
    try{
      const source=await loadAlertData(env,alert);
      if(!source)throw Error('source_not_found');
      const subject=alert.source_type==='partner_application'?'Nova parceria Source AO':'Novo pedido de sourcing Source AO';
      const response=await fetch('https://api.resend.com/emails',{
        method:'POST',signal:AbortSignal.timeout(10000),
        headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','Idempotency-Key':'sourceao-'+alert.reference},
        body:JSON.stringify({from:env.SOURCE_AO_ALERT_FROM,to:[env.SOURCE_AO_ALERT_TO],
          subject:subject+' · '+alert.reference,
          text:alertText(alert.source_type,source.row,source.contact)})
      });
      if(!response.ok)throw Error('provider_http_'+response.status);
      await db.prepare("UPDATE intake_alerts SET state='sent',sent_at=?,attempts=attempts+1 WHERE id=? AND state='pending'")
        .bind(now.toISOString(),alert.id).run();
      sent++;
    }catch(_){
      const attempts=Number(alert.attempts||0)+1;
      const next=new Date(now.getTime()+retryMinutes(attempts)*60000).toISOString();
      await db.prepare("UPDATE intake_alerts SET attempts=?,next_attempt_at=? WHERE id=? AND state='pending'")
        .bind(attempts,next,alert.id).run();
      failed++;
    }
  }
  return {configured:true,processed:(rows.results||[]).length,sent,failed};
}

export async function intakeAlertStatus(env){
  if(!env.SOURCE_AO_DB)return {configured:false,error:'database_unavailable'};
  const counts=await env.SOURCE_AO_DB.prepare("SELECT state,COUNT(*) total FROM intake_alerts GROUP BY state").all();
  const result={pending:0,sent:0};
  for(const row of counts.results||[])if(row.state==='pending'||row.state==='sent')result[row.state]=Number(row.total||0);
  return {configured:deliveryReady(env),...result};
}
