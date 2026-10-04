import {normalizeSearch,effectiveObservationStatus} from './index.js';

function headers(env){
  return {
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
    'access-control-allow-methods':'GET,OPTIONS',
    'access-control-allow-headers':'content-type,authorization'
  };
}

function json(env,data,status=200){return new Response(JSON.stringify(data),{status,headers:headers(env)});}
function fail(env,status,code,message){return json(env,{ok:false,error:{code,message}},status);}

export function mapPublicItemRow(r,now=Date.now()){
  const status=r.observation_id?effectiveObservationStatus(r,now):'discovered';
  const verification=r.observation_id?{
    source_type:r.source_type||null,
    verified_at:r.verified_at||null,
    expires_at:r.expires_at||null
  }:null;

  return {
    type:'item',
    id:r.item_id,
    name:r.item_name,
    category:r.category,
    specification:r.specification,
    unit:r.unit,
    status,
    verified_at:r.verified_at||null,
    expires_at:r.expires_at||null,
    verification
  };
}

export async function publicSearch(request,env){
  const url=new URL(request.url);
  const raw=(url.searchParams.get('q')||'').trim();
  const location=(url.searchParams.get('location')||'Luanda').trim();
  if(raw.length<2||raw.length>180) return fail(env,400,'invalid_query','Search query must contain 2 to 180 characters.');
  if(location.length>120) return fail(env,400,'invalid_location','Location is too long.');

  const q=normalizeSearch(raw);
  const like=`%${q}%`;
  const normalizedLocation=normalizeSearch(location);
  const locationLike=`%${normalizedLocation}%`;

  const itemRows=await env.SOURCE_AO_DB.prepare(`
    SELECT i.id item_id,i.name item_name,i.category,i.specification,i.unit,
           o.id observation_id,o.verification_status,o.verified_at,o.expires_at,o.source_type
    FROM items i
    LEFT JOIN observations o ON o.id=(
      SELECT oo.id
      FROM observations oo
      JOIN suppliers os ON os.id=oo.supplier_id
      WHERE oo.item_id=i.id
        AND oo.approved_at IS NOT NULL
        AND (?='angola' OR lower(coalesce(oo.location,os.location,'')) LIKE ?)
      ORDER BY oo.verified_at DESC
      LIMIT 1
    )
    WHERE i.search_text LIKE ?
    ORDER BY CASE o.verification_status
      WHEN 'in_stock_confirmed' THEN 1
      WHEN 'supplier_confirmed' THEN 2
      WHEN 'source_checked' THEN 3
      WHEN 'unavailable' THEN 4
      ELSE 9 END,
      o.verified_at DESC
    LIMIT 12
  `).bind(normalizedLocation,locationLike,like).all();

  const serviceRows=await env.SOURCE_AO_DB.prepare(`
    SELECT service_category,MAX(last_verified_at) last_verified_at
    FROM service_providers
    WHERE search_text LIKE ? AND (?='angola' OR lower(location) LIKE ?)
    GROUP BY service_category
    ORDER BY last_verified_at DESC LIMIT 8
  `).bind(like,normalizedLocation,locationLike).all();

  const items=(itemRows.results||[]).map(r=>mapPublicItemRow(r));
  // Provider identities and supplier shortlists belong to the authenticated desk.
  // A category match is not a confirmation of service availability.
  const serviceLabels={construction:'Construção',remodelling:'Remodelação',facilities:'Facilities',cleaning:'Limpeza',electrical:'Electricidade',hvac:'Climatização / AVAC',plumbing:'Canalização','industrial-maintenance':'Manutenção industrial','transport-logistics':'Transporte e logística','technical-services':'Serviços técnicos','services-contractors':'Serviços e empreitadas'};
  const services=(serviceRows.results||[]).map(r=>{
    const checked=new Date(r.last_verified_at).getTime();
    const ageHours=Number.isFinite(checked)?(Date.now()-checked)/36e5:Infinity;
    return {
      type:'service',id:`service-category-${r.service_category}`,
      name:serviceLabels[r.service_category]||'Serviço sob consulta',category:r.service_category,location,
      status:ageHours>=0&&ageHours<=168?'source_checked':'needs_reconfirmation',
      verified_at:r.last_verified_at
    };
  });

  return json(env,{ok:true,query:raw,normalized_query:q,location,results:[...items,...services]});
}
