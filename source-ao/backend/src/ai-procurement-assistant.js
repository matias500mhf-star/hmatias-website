import {isAdmin} from './index.js';
import {buildProcurementMission} from './procurement-mission.js';

const headers=env=>({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
  'access-control-allow-methods':'POST,OPTIONS',
  'access-control-allow-headers':'content-type,authorization'
});
const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:headers(env)});
const fail=(env,status,code,message)=>json(env,{ok:false,error:{code,message}},status);

function cleanText(value,max){
  if(typeof value!=='string')return null;
  const clean=value.trim();
  return clean && clean.length<=max ? clean : null;
}

function validateInput(data){
  const query=cleanText(data?.query,180);
  const location=data?.location==null?'Luanda':cleanText(data.location,120);
  const neededBy=data?.needed_by==null?'':cleanText(data.needed_by,80);
  let quantity=null;
  if(data?.quantity!=null && data.quantity!==''){
    quantity=Number(data.quantity);
    if(!Number.isFinite(quantity)||quantity<0||quantity>1e9)return null;
  }
  if(!query||query.length<2||!location||neededBy===null)return null;
  return {query,location,needed_by:neededBy||'',quantity};
}

export async function interpretSourcingRequest(env,input){
  if(!env.GEMINI_API_KEY)return {error:'ai_not_configured'};
  const model=cleanText(env.GEMINI_MODEL||'gemini-2.5-flash',80);
  if(!model||!/^[a-zA-Z0-9._-]+$/.test(model))return {error:'ai_configuration_invalid'};

  const prompt=[
    'You are the query interpretation component of SOURCE AO, an Angola procurement platform.',
    'Interpret the buyer request for searching existing supplier and product records.',
    'Do not claim that any supplier exists, has stock, has a price, or is available.',
    'Return only JSON with these keys: search_query, location, needed_by, quantity, category, specifications, search_terms, clarification_needed, clarification_question.',
    'search_query must preserve the requested product/service and material specifications without inventing requirements.',
    'location must use the supplied location unless the buyer explicitly specifies another location.',
    'quantity must be a non-negative number or null. specifications and search_terms must be arrays of short strings.',
    'clarification_needed must be a boolean; clarification_question must be a short string or null.',
    'Use Portuguese where suitable. Keep the result concise.',
    'Buyer request JSON:',
    JSON.stringify(input)
  ].join('\n');

  let response;
  try{
    response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
      method:'POST',
      headers:{'content-type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
      body:JSON.stringify({
        contents:[{role:'user',parts:[{text:prompt}]}],
        generationConfig:{responseMimeType:'application/json',temperature:0.1}
      })
    });
  }catch{
    return {error:'ai_provider_unreachable'};
  }
  if(!response.ok)return {error:response.status===429?'ai_rate_limited':'ai_provider_error'};
  let payload;
  try{payload=await response.json();}catch{return {error:'ai_invalid_response'};}
  const raw=payload?.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('').trim();
  if(!raw||raw.length>12000)return {error:'ai_invalid_response'};
  let parsed;
  try{parsed=JSON.parse(raw);}catch{return {error:'ai_invalid_response'};}

  const searchQuery=cleanText(parsed.search_query,180)||input.query;
  const location=cleanText(parsed.location,120)||input.location;
  const neededBy=parsed.needed_by==null?'':cleanText(parsed.needed_by,80);
  const quantity=parsed.quantity==null?input.quantity:Number(parsed.quantity);
  if(neededBy===null||!Number.isFinite(quantity===null?0:quantity)||quantity<0)return {error:'ai_invalid_response'};
  const strings=value=>Array.isArray(value)?value.filter(v=>typeof v==='string').map(v=>v.trim()).filter(Boolean).slice(0,12):[];
  return {value:{
    search_query:searchQuery,
    location,
    needed_by:neededBy||input.needed_by,
    quantity,
    category:cleanText(parsed.category,80)||'general',
    specifications:strings(parsed.specifications),
    search_terms:strings(parsed.search_terms),
    clarification_needed:parsed.clarification_needed===true,
    clarification_question:cleanText(parsed.clarification_question,300)
  }};
}

export async function aiProcurementAssistantResponse(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const type=request.headers.get('content-type')||'';
  if(!type.includes('application/json'))return fail(env,415,'json_required','Send an application/json request.');
  let data;
  try{data=await request.json();}catch{return fail(env,400,'invalid_json','Request body must be valid JSON.');}
  const input=validateInput(data);
  if(!input)return fail(env,400,'invalid_input','Provide a query (2–180 characters), valid location, needed_by and optional non-negative quantity.');

  const interpretation=await interpretSourcingRequest(env,input);
  if(interpretation.error){
    const status=interpretation.error==='ai_not_configured'||interpretation.error==='ai_configuration_invalid'?503:
      interpretation.error==='ai_rate_limited'?429:502;
    return fail(env,status,interpretation.error,'AI interpretation is unavailable; no procurement claims were generated.');
  }

  // Search and commercial evidence remain inside SOURCE AO's existing backend.
  // Gemini is only used to interpret the request; it cannot invent supplier, stock or price data.
  let mission;
  try{
    mission=await buildProcurementMission(env,{
      query:interpretation.value.search_query,
      location:interpretation.value.location,
      neededBy:interpretation.value.needed_by,
      quantity:interpretation.value.quantity
    });
  }catch{
    return fail(env,500,'procurement_search_failed','The interpreted request could not be searched in SOURCE AO.');
  }
  return json(env,{
    ok:true,
    interpretation:interpretation.value,
    mission,
    evidence_policy:'Supplier, stock and price claims come only from SOURCE AO records and traceable supplier confirmations, never from the AI interpretation.'
  });
}
