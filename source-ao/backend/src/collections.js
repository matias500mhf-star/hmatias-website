import {isAdmin} from './sourcing.js';

const PAYMENT_METHODS=new Set(['bank_transfer','cash','pos','other']);

function headers(env){
  return {
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type,authorization'
  };
}
function json(env,data,status=200){return new Response(JSON.stringify(data),{status,headers:headers(env)});}
function fail(env,status,code,message){return json(env,{ok:false,error:{code,message}},status);}
function nowIso(){return new Date().toISOString();}
function id(prefix){return prefix+'_'+crypto.randomUUID().replaceAll('-','').slice(0,24);}
function roundMoney(value){return Math.round((Number(value)+Number.EPSILON)*100)/100;}

function clean(value,max=800){
  if(value==null)return null;
  if(typeof value!=='string'&&typeof value!=='number')throw new Error('invalid_text');
  const out=String(value).trim();
  if(out.length>max)throw new Error('text_too_long');
  return out||null;
}
function requiredText(value,max=160){
  const out=clean(value,max);
  if(!out)throw new Error('required_text');
  return out;
}
function positiveMoney(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0||n>1e15)throw new Error('invalid_money');
  return roundMoney(n);
}
function iso(value,{allowNull=false}={}){
  if(value==null||value===''){
    if(allowNull)return null;
    throw new Error('date_required');
  }
  const raw=clean(value,80);
  const date=new Date(raw);
  if(!raw||Number.isNaN(date.getTime()))throw new Error('invalid_date');
  return date.toISOString();
}

export function buildCollectionSummary(invoice=null,payments=[],asOf=new Date()){
  const active=payments.filter(row=>!row.voided_at);
  const received=roundMoney(active.reduce((sum,row)=>sum+Number(row.amount_aoa||0),0));
  if(!invoice){
    return {
      status:'not_invoiced',
      invoice_amount_aoa:null,
      total_received_aoa:received,
      outstanding_aoa:null,
      overpayment_aoa:null,
      collection_rate_pct:null,
      overdue_days:0,
      payment_count:active.length
    };
  }
  const amount=Number(invoice.invoice_amount_aoa);
  const outstanding=roundMoney(Math.max(amount-received,0));
  const overpayment=roundMoney(Math.max(received-amount,0));
  const due=invoice.due_date?new Date(invoice.due_date):null;
  const now=asOf instanceof Date?asOf:new Date(asOf);
  const overdue=due&&!Number.isNaN(due.getTime())&&due.getTime()<now.getTime()&&outstanding>0;
  const overdueDays=overdue?Math.max(1,Math.floor((now.getTime()-due.getTime())/86400000)):0;
  let status='issued';
  if(outstanding<=0)status='paid';
  else if(overdue)status='overdue';
  else if(received>0)status='partial';
  return {
    status,
    invoice_amount_aoa:roundMoney(amount),
    total_received_aoa:received,
    outstanding_aoa:outstanding,
    overpayment_aoa:overpayment,
    collection_rate_pct:amount>0?Math.round((received/amount)*10000)/100:null,
    overdue_days:overdueDays,
    payment_count:active.length
  };
}

export function validateInvoiceInput(data={}){
  try{
    const invoiceRef=requiredText(data.invoice_ref,160);
    const invoiceDate=iso(data.invoice_date);
    const dueDate=iso(data.due_date,{allowNull:true});
    const amount=positiveMoney(data.invoice_amount_aoa);
    const notes=clean(data.internal_notes,1600);
    if(dueDate&&new Date(dueDate).getTime()<new Date(invoiceDate).getTime()){
      return {ok:false,code:'due_before_invoice'};
    }
    return {ok:true,value:{invoice_ref:invoiceRef,invoice_date:invoiceDate,due_date:dueDate,invoice_amount_aoa:amount,internal_notes:notes}};
  }catch{return {ok:false,code:'invalid_invoice'};}
}

export function validatePaymentInput(data={}){
  try{
    const paymentRef=requiredText(data.payment_ref,160);
    const paymentMethod=clean(data.payment_method,40)||'bank_transfer';
    if(!PAYMENT_METHODS.has(paymentMethod))return {ok:false,code:'invalid_payment_method'};
    return {ok:true,value:{
      payment_ref:paymentRef,
      payment_method:paymentMethod,
      amount_aoa:positiveMoney(data.amount_aoa),
      received_at:iso(data.received_at),
      internal_notes:clean(data.internal_notes,1200)
    }};
  }catch{return {ok:false,code:'invalid_payment'};}
}

async function requestContext(env,requestId){
  const row=await env.SOURCE_AO_DB.prepare(`
    SELECT r.id,r.public_ref,r.status,r.requirement_text,
      f.stage,f.delivered_at,f.final_revenue_aoa
    FROM sourcing_requests r
    LEFT JOIN sourcing_fulfillment_cases f ON f.request_id=r.id
    WHERE r.id=?
  `).bind(requestId).first();
  if(!row)return null;
  return {
    id:row.id,reference:row.public_ref,status:row.status,requirement_text:row.requirement_text,
    fulfillment_stage:row.stage||'pending',
    delivered_at:row.delivered_at||null,
    final_revenue_aoa:row.final_revenue_aoa==null?null:Number(row.final_revenue_aoa)
  };
}

async function readInvoice(env,requestId){
  const row=await env.SOURCE_AO_DB.prepare('SELECT * FROM sourcing_invoices WHERE request_id=?').bind(requestId).first();
  return row?{
    request_id:row.request_id,
    invoice_ref:row.invoice_ref,
    invoice_date:row.invoice_date,
    due_date:row.due_date,
    invoice_amount_aoa:Number(row.invoice_amount_aoa),
    internal_notes:row.internal_notes,
    created_at:row.created_at,
    updated_at:row.updated_at
  }:null;
}

async function readPayments(env,requestId){
  const rows=await env.SOURCE_AO_DB.prepare(
    'SELECT id,request_id,payment_ref,payment_method,amount_aoa,received_at,internal_notes,voided_at,void_reason,created_at FROM sourcing_payments WHERE request_id=? ORDER BY received_at DESC,created_at DESC'
  ).bind(requestId).all();
  return (rows.results||[]).map(row=>({...row,amount_aoa:Number(row.amount_aoa)}));
}

async function buildPayload(env,requestId){
  const context=await requestContext(env,requestId);
  if(!context)return null;
  const [invoice,payments]=await Promise.all([readInvoice(env,requestId),readPayments(env,requestId)]);
  return {
    ok:true,
    confidential:true,
    request:context,
    invoice,
    payments,
    summary:buildCollectionSummary(invoice,payments)
  };
}

export async function getCollectionsCase(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const payload=await buildPayload(env,requestId);
  if(!payload)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  return json(env,payload);
}

export async function upsertInvoice(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const context=await requestContext(env,requestId);
  if(!context)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  if(!['delivered','completed'].includes(context.fulfillment_stage)){
    return fail(env,409,'delivery_required','Invoice registration requires a recorded delivery.');
  }
  let data;
  try{data=await request.json();}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  const validated=validateInvoiceInput(data);
  if(!validated.ok)return fail(env,400,validated.code,'Check invoice reference, dates and amount.');
  const v=validated.value;
  const timestamp=nowIso();
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO sourcing_invoices(request_id,invoice_ref,invoice_date,due_date,invoice_amount_aoa,internal_notes,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(request_id) DO UPDATE SET
      invoice_ref=excluded.invoice_ref,invoice_date=excluded.invoice_date,due_date=excluded.due_date,
      invoice_amount_aoa=excluded.invoice_amount_aoa,internal_notes=excluded.internal_notes,updated_at=excluded.updated_at
  `).bind(requestId,v.invoice_ref,v.invoice_date,v.due_date,v.invoice_amount_aoa,v.internal_notes,timestamp,timestamp).run();
  return json(env,await buildPayload(env,requestId));
}

export async function addPayment(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const context=await requestContext(env,requestId);
  if(!context)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  const invoice=await readInvoice(env,requestId);
  if(!invoice)return fail(env,409,'invoice_required','Create the invoice before recording a payment.');
  let data;
  try{data=await request.json();}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  const validated=validatePaymentInput(data);
  if(!validated.ok)return fail(env,400,validated.code,'Check payment reference, method, amount and date.');
  const v=validated.value;
  const duplicate=await env.SOURCE_AO_DB.prepare(
    'SELECT id FROM sourcing_payments WHERE request_id=? AND payment_ref=?'
  ).bind(requestId,v.payment_ref).first();
  if(duplicate)return fail(env,409,'payment_reference_exists','A payment with this reference already exists for the request.');
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO sourcing_payments(id,request_id,payment_ref,payment_method,amount_aoa,received_at,internal_notes,created_at)
    VALUES(?,?,?,?,?,?,?,?)
  `).bind(id('pay'),requestId,v.payment_ref,v.payment_method,v.amount_aoa,v.received_at,v.internal_notes,nowIso()).run();
  return json(env,await buildPayload(env,requestId),201);
}

export async function voidPayment(request,env,requestId,paymentId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const context=await requestContext(env,requestId);
  if(!context)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  let data;
  try{data=await request.json();}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  let reason;
  try{reason=requiredText(data.reason,500);}catch{return fail(env,400,'void_reason_required','A reason is required to void a payment.');}
  const payment=await env.SOURCE_AO_DB.prepare(
    'SELECT id,voided_at FROM sourcing_payments WHERE id=? AND request_id=?'
  ).bind(paymentId,requestId).first();
  if(!payment)return fail(env,404,'payment_not_found','Payment does not exist.');
  if(payment.voided_at)return fail(env,409,'payment_already_voided','Payment is already voided.');
  await env.SOURCE_AO_DB.prepare(
    'UPDATE sourcing_payments SET voided_at=?,void_reason=? WHERE id=? AND request_id=?'
  ).bind(nowIso(),reason,paymentId,requestId).run();
  return json(env,await buildPayload(env,requestId));
}
