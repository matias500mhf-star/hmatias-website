// Shared public RFQ contract. No supplier identities, buying prices or margins belong here.
export const MAX_ITEMS = 20;
export const UNITS = ['un','caixa','rolo','par','kit','m','m²','m³','kg','L','serviço'];
export const CATEGORY_LABELS = {
  construction: ['Construção & interiores','Construction & interiors'],
  'hvac-electrical': ['Climatização & eletricidade','HVAC & electrical'],
  'tools-equipment': ['Ferramentas & equipamentos','Tools & equipment'],
  'cleaning-facilities': ['Limpeza & facilities','Cleaning & facilities'],
  'services-contractors': ['Serviços & empreiteiros','Services & contractors'],
  'industrial-supply': ['Indústria, EPI & consumíveis','Industrial, PPE & consumables'],
  other: ['Outra necessidade','Other requirement']
};
export const categoryLabel = (id, en=false) => CATEGORY_LABELS[id]?.[en?1:0] || id;
export const itemLabel = (item, en=false) => en ? item.name : (item.name_pt || item.name);

const text = (value,max,required=false) => {
  if(value==null && !required) return '';
  if(typeof value!=='string') throw new Error('invalid_text');
  const result=value.trim();
  if(result.length>max || (required && !result)) throw new Error('invalid_text');
  return result;
};
const choice = (value,allowed) => {
  if(!allowed.includes(value)) throw new Error('invalid_choice');
  return value;
};
export function validContact(value,channel) {
  if(channel==='email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g,'').length>=7 && value.replace(/\D/g,'').length<=15;
}

export function validateRfq(data,catalog,now=new Date()) {
  try {
    if(!data || data.rfq_version!==1 || !Array.isArray(data.items) || !data.items.length || data.items.length>MAX_ITEMS) throw new Error('invalid_items');
    if(!/^[a-f0-9]{64}$/.test(data.client_token||'')) throw new Error('invalid_token');
    if(data.consent!==true || data.website) throw new Error('invalid_consent');
    const items=data.items.map(row=>{
      if(!row || typeof row!=='object') throw new Error('invalid_items');
      const catalogId=text(row.catalog_item_id,100);
      const product=catalog.items.find(item=>item.id===catalogId);
      if(catalogId && !product) throw new Error('invalid_catalog_item');
      const category=product?.category || choice(row.category,Object.keys(CATEGORY_LABELS));
      const quantity=Number(row.quantity);
      if(!['string','number'].includes(typeof row.quantity) || !Number.isFinite(quantity) || quantity<=0 || quantity>1e9) throw new Error('invalid_quantity');
      return {catalog_item_id:product?.id||null,category,description:text(row.description,200,true),specification:text(row.specification,600),quantity,unit:choice(row.unit,UNITS)};
    });
    const channel=choice(data.contact_channel,['whatsapp','phone','email']);
    const contact=text(data.requester_contact,180,true);
    if(!validContact(contact,channel)) throw new Error('invalid_contact');
    const neededBy=text(data.needed_by,10);
    const today=now.toISOString().slice(0,10);
    if(neededBy && (!/^\d{4}-\d{2}-\d{2}$/.test(neededBy) || !Number.isFinite(Date.parse(neededBy)) || new Date(neededBy).toISOString().slice(0,10)!==neededBy || neededBy<today)) throw new Error('invalid_date');
    const budget=data.budget==null || data.budget==='' ? null : Number(data.budget);
    if(budget!=null && (!['string','number'].includes(typeof data.budget) || !Number.isFinite(budget) || budget<0 || budget>1e12)) throw new Error('invalid_budget');
    return {ok:true,value:{
      version:1,items,requester_name:text(data.requester_name,120,true),company:text(data.company,160),
      buyer_type:choice(data.buyer_type,['company','individual','institution']),
      requester_contact:contact,contact_channel:channel,location:text(data.location,100,true),needed_by:neededBy||null,
      urgency:choice(data.urgency,['normal','urgent','planned']),intent:choice(data.intent,['ready','budgeting','recurring']),
      alternatives:choice(data.alternatives,['yes','no','discuss']),budget,currency:'AOA',notes:text(data.notes,1500),
      consent:true,origin:choice(data.origin||'source-ao',['source-ao','supply','catalog']),language:data.language==='en'?'en':'pt'
    }};
  } catch(error) { return {ok:false,code:error.message||'invalid_rfq'}; }
}
