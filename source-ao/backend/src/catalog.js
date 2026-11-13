import {isAdmin} from './index.js';

const PUBLIC_EXCLUDED_ITEMS=new Set(['item-formaldehyde']);
const ALLOWED_CATEGORIES=new Set([
  'construction',
  'hvac-electrical',
  'tools-equipment',
  'cleaning-facilities',
  'services-contractors',
  'industrial-supply',
  'other'
]);

const jsonArray=(value)=>{
  try{
    const parsed=JSON.parse(value||'[]');
    return Array.isArray(parsed)?parsed.filter(item=>typeof item==='string'):[];
  }catch{return []}
};

const clean=(value,max,required=false)=>{
  if(value==null&&!required)return null;
  if(typeof value!=='string')throw new Error('invalid_text');
  const result=value.trim();
  if(result.length>max||(required&&!result))throw new Error('invalid_text');
  return result||null;
};

const cleanWords=(value,field)=>{
  if(!Array.isArray(value)||value.length>25)throw new Error('invalid_'+field);
  const result=value.map(item=>{
    if(typeof item!=='string')throw new Error('invalid_'+field);
    const cleanItem=item.trim();
    if(!cleanItem||cleanItem.length>120)throw new Error('invalid_'+field);
    return cleanItem;
  });
  return [...new Set(result)];
};

const normalize=value=>String(value||'').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

const headers=(env,{publicRead=false}={})=>({
  'content-type':'application/json; charset=utf-8',
  'cache-control':publicRead?'public, max-age=300, stale-while-revalidate=300':'no-store',
  'access-control-allow-origin':env?.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
  'access-control-allow-methods':'GET,PATCH,OPTIONS',
  'access-control-allow-headers':'content-type,authorization'
});

const response=(env,data,status=200,options={})=>
  new Response(JSON.stringify(data),{status,headers:headers(env,options)});

const fail=(env,status,code)=>response(env,{ok:false,error:{code}},status);

function publicItem(row){
  return {
    id:row.id,
    name:row.name,
    name_pt:row.name_pt||row.name,
    category:row.category,
    specification:row.specification||'',
    unit:row.unit||'',
    aliases:jsonArray(row.aliases_json),
    keywords:jsonArray(row.keywords_json)
  };
}

export async function listPublicCatalog(request,env){
  if(request.method!=='GET')return fail(env,405,'method_not_allowed');
  if(!env?.SOURCE_AO_DB)return fail(env,503,'catalog_unavailable');

  try{
    const result=await env.SOURCE_AO_DB.prepare(`
      SELECT id,name,name_pt,category,specification,unit,aliases_json,keywords_json,public_visible,updated_at
      FROM items
      WHERE public_visible=1 AND id NOT IN ('item-formaldehyde')
      ORDER BY category ASC,name ASC
    `).all();
    const rows=(result.results||[]).filter(row=>Number(row.public_visible)===1&&!PUBLIC_EXCLUDED_ITEMS.has(row.id));
    const timestamps=rows.map(row=>row.updated_at).filter(Boolean).sort();
    return response(env,{
      ok:true,
      version:1,
      updated_at:timestamps.at(-1)||null,
      items:rows.map(publicItem)
    },200,{publicRead:true});
  }catch{
    return fail(env,503,'catalog_unavailable');
  }
}

export async function listAdminCatalog(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized');
  if(request.method!=='GET')return fail(env,405,'method_not_allowed');
  try{
    const result=await env.SOURCE_AO_DB.prepare(`
      SELECT id,name,name_pt,category,specification,unit,aliases_json,keywords_json,public_visible,updated_at
      FROM items
      ORDER BY category ASC,name ASC
    `).all();
    return response(env,{
      ok:true,
      items:(result.results||[]).map(row=>({
        ...publicItem(row),
        public_visible:Number(row.public_visible)===1,
        updated_at:row.updated_at||null
      }))
    });
  }catch{
    return fail(env,503,'catalog_unavailable');
  }
}

export async function updateCatalogItem(request,env,itemId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized');
  if(request.method!=='PATCH')return fail(env,405,'method_not_allowed');
  if(!itemId||itemId.length>120)return fail(env,400,'invalid_id');

  let input;
  try{input=await request.json()}catch{return fail(env,400,'invalid_json')}
  if(!input||typeof input!=='object'||Array.isArray(input))return fail(env,400,'invalid_payload');

  const current=await env.SOURCE_AO_DB.prepare(`
    SELECT id,name,name_pt,category,specification,unit,aliases_json,keywords_json,public_visible
    FROM items WHERE id=?
  `).bind(itemId).first();
  if(!current)return fail(env,404,'item_not_found');

  let name,namePt,category,specification,unit,aliases,keywords,publicVisible;
  try{
    name=Object.hasOwn(input,'name')?clean(input.name,160,true):current.name;
    namePt=Object.hasOwn(input,'name_pt')?clean(input.name_pt,160):current.name_pt;
    category=Object.hasOwn(input,'category')?clean(input.category,100,true):current.category;
    if(!ALLOWED_CATEGORIES.has(category))throw new Error('invalid_category');
    specification=Object.hasOwn(input,'specification')?clean(input.specification,1200):current.specification;
    unit=Object.hasOwn(input,'unit')?clean(input.unit,40):current.unit;
    aliases=Object.hasOwn(input,'aliases')?cleanWords(input.aliases,'aliases'):jsonArray(current.aliases_json);
    keywords=Object.hasOwn(input,'keywords')?cleanWords(input.keywords,'keywords'):jsonArray(current.keywords_json);
    publicVisible=Object.hasOwn(input,'public_visible')
      ?(input.public_visible===true?1:input.public_visible===false?0:(()=>{throw new Error('invalid_visibility')})())
      :Number(current.public_visible)===1?1:0;
  }catch(error){
    const code=error instanceof Error?error.message:'invalid_catalog_item';
    return fail(env,400,code);
  }

  if(PUBLIC_EXCLUDED_ITEMS.has(itemId)&&publicVisible===1)return fail(env,400,'item_not_publishable');

  const searchText=normalize([name,namePt,specification,...aliases,...keywords].filter(Boolean).join(' '));
  try{
    await env.SOURCE_AO_DB.prepare(`
      UPDATE items
      SET name=?,name_pt=?,category=?,specification=?,unit=?,aliases_json=?,keywords_json=?,
          search_text=?,public_visible=?,management_mode='managed',updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      name,namePt,category,specification,unit,JSON.stringify(aliases),JSON.stringify(keywords),
      searchText,publicVisible,itemId
    ).run();
    return response(env,{ok:true,item:{
      id:itemId,name,name_pt:namePt||name,category,specification:specification||'',
      unit:unit||'',aliases,keywords,public_visible:publicVisible===1
    }});
  }catch{
    return fail(env,503,'catalog_update_failed');
  }
}
