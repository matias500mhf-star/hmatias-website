import {isAdmin} from './index.js';
import {buildOpportunityIntelligence,buildCopilotBrief} from './intelligence.js';
import {matchCommercialPartners} from './partner-network.js';

const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com'
}});

async function candidate(env,id){
  return env.SOURCE_AO_DB.prepare(
    'SELECT c.*,s.name source_name FROM opportunity_candidates c LEFT JOIN opportunity_sources s ON s.id=c.source_id WHERE c.id=? LIMIT 1'
  ).bind(id).first();
}

async function opportunity(env,id){
  return env.SOURCE_AO_DB.prepare(
    'SELECT o.*,s.name source_name FROM opportunities o LEFT JOIN opportunity_sources s ON s.id=o.discovery_source_id WHERE o.id=? LIMIT 1'
  ).bind(id).first();
}

function hydrate(row){
  if(!row)return row;
  let fitTags=[];
  try{fitTags=JSON.parse(row.fit_tags_json||'[]')}catch{}
  return {...row,fit_tags:fitTags};
}

export async function copilotOpportunityResponse(request,env,{kind,id}){
  if(!isAdmin(request,env))return json(env,{ok:false,error:{code:'unauthorized',message:'Admin authorization required.'}},401);
  const row=kind==='candidate'?await candidate(env,id):await opportunity(env,id);
  if(!row)return json(env,{ok:false,error:{code:'opportunity_not_found',message:'Opportunity record not found.'}},404);
  const record=hydrate(row);
  const intelligence=buildOpportunityIntelligence(record);
  const copilot=buildCopilotBrief(record,intelligence);
  const partner_matches=await matchCommercialPartners(env,record,{limit:6});
  return json(env,{ok:true,kind,intelligence,copilot,partner_matches});
}
