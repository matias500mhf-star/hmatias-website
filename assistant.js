/* HMATIAS Virtual Assistant — bilingual official knowledge + page context + AI. */
(() => {
'use strict';
const API=['https://api.comercialhmatiasps.com/api/ai','/api/ai'];
const WA='https://wa.me/244948806673',KB_SRC='assistant-knowledge.js?v=20261028-source-of-truth1';
const pageEn=(document.documentElement.lang||'').toLowerCase().startsWith('en');
window.HMATIAS_ASSISTANT_VERSION='2026-10-28-source-of-truth1';
const getKB=()=>window.HMATIAS_KNOWLEDGE||null;
const enFor=q=>pageEn||/\b(hello|hi|hey|please|what|where|when|how|can|could|do|does|is|are|price|service|visa|appointment|cleaning|construction|facilities|supply|contact|document|quote|quotation|b[...]
const normalizeProductAlias=q=>{const raw=String(q||'');if(!/\b(?:pingel|pinegel|pin\s*gel|pinho\s*gel)\b/i.test(raw))return raw;const replacement=/\b(?:taurus|t563p)\b/i.test(raw)?'Taurus Pine Ge[...]
let kbPromise=null;
function loadKB(){if(getKB())return Promise.resolve(getKB());if(kbPromise)return kbPromise;kbPromise=new Promise(resolve=>{let settled=false;const done=()=>{if(settled)return;settled=true;resolve([...]
function add(box,text,kind){const e=document.createElement('div');e.className=`hmatias-assistant-msg ${kind}`;e.textContent=text;box.appendChild(e);box.scrollTop=box.scrollHeight;return e}
function catalogItem(q){const d=getKB(),m=normalizeProductAlias(q).toLowerCase();return d?.clean?.cleanCatalog?.find(([c,n])=>m.includes(c.toLowerCase())||m.includes(n.toLowerCase()))||null}
function pageContext(){const main=document.querySelector('main');const page=(main?.innerText||document.body.innerText||'').replace(/\s+/g,' ').trim();const official=getKB()?.toAssistantContext?.()[...]
function official(q){const d=getKB();if(!d)return null;const m=normalizeProductAlias(q).toLowerCase(),en=enFor(q),item=catalogItem(q),c=d.company;
 if(/\b(?:email|e-mail|correio eletr[oó]nico|contacto|contato|contact|phone number|telefone|whatsapp)\b|qual (?:é|e) o email|qual o email|email da empresa/i.test(m))return en?'HMATIAS contacts: '
  +c.phone+' (WhatsApp), general/commercial enquiries: '+c.emailGeneral+', institutional information: '+c.emailInstitutional+'.'
  :'Contactos HMATIAS: '+c.phone+' (WhatsApp), pedidos e comercial: '+c.emailGeneral+', informação institucional: '+c.emailInstitutional+'.';
 if(/\b(?:cota[cç][aã]o|cota[cç][oõ]es|or[cç]amento|quotation|quote|request a quote)\b/i.test(m))return en?'To request a quotation, contact HMATIAS via WhatsApp at '+c.phone+' or email '+c.emailGeneral+'.'
  :'Para pedir uma cotação, contacte a HMATIAS pelo WhatsApp '+c.phone+' ou pelo email '+c.emailGeneral+'.';
 if(/informação institucional|informacao institucional|perfil institucional|apresentação da empresa|apresentacao da empresa|institutional information|company profile|info@comercialhmatiasps\.c[...]
 if(/(formul[aá]rio|form|lead|pedido).*(cheg|envi|receb|regist|notific|received|delivered|sent|tracking)|(?:lead|pedido).*(whatsapp|email|e-mail|crm)/.test(m)){
  const x=d.sourceAO;
  return en?`${x.intakeTruthEn} ${x.searchTruthEn} Source AO structured RFQ: ${d.pages.sourceRfq}.`
    :`${x.intakeTruthPt} ${x.searchTruthPt} RFQ persistente Source AO: ${d.pages.sourceRfq}.`;
 }
 if(/source\s*ao|procura\.ao|source\s*copilot|opportunit(?:y|ies)|intelligence\s*radar|radar\s+de\s+oportunidades/.test(m)){const s=d.sourceAO;return en?`${s.positioningEn} Commercial opportunitie[...]
 if(/\bkarta\b|identity\s*wallet|carteira\s+digital/.test(m)){const x=d.karta;return en?`${x.summaryEn} Commercial status: pre-launch / Alpha; it is not presented as a publicly downloadable app. C[...]
 if(/cat[aá]logo\s+de\s+obras|work\s+catalogue|portf[oó]lio|portfolio/.test(m)){return en?`The HMATIAS works catalogue presents selected photographic records of executed work. Client, date and l[...]
 if(/credibilidade|credibility|nif|registo\s+comercial|commercial\s+registration/.test(m)){return en?`Official HMATIAS institutional details published on the site: legal name ${c.name}; Tax ID ${c[...]
 if(/smart\s*rfq|\brfq\b|pedido de cota[çc][aã]o|request for quotation/.test(m))return en?'HMATIAS Smart RFQ helps you structure a commercial request for Construction & Remodelling, Facilities &[...]
 if(/123\s*pine|pine.*500\s*ml|500\s*ml.*pine/.test(m))return en?'123 Pine Gel 500 ml is a featured HMATIAS Clean multipurpose product for domestic and professional use. It is supplied on order; p[...]
 if(/t563p|taurus\s*pine|pine\s*gel/.test(m))return en?'Taurus Pine Gel T563P is listed as a multipurpose cleaning gel in the HMATIAS Clean catalogue. Pack size, price, stock, lead time and delive[...]
 if(item){const[cod,n,cat]=item;return en?`${n} (${cod}) is listed in the HMATIAS Clean professional catalogue under ${cat}. The website does not publish a confirmed price, format or live stock fo[...]
 if(/pre[çc]o|quanto custa|valor|price|cost|or[çc]amento|quotation/.test(m)&&/(cv|curr[ií]culo|expediente|reda[çc][aã]o|documental|business services|business support|apresenta[çc]|pme|admini[...]
 if(/visto|consular|vfs|embaixad|visa|appointment slot/.test(m))return en?'Visa and consular appointment services are not part of the HMATIAS website offer. For official procedures, consult the co[...]
 if(/agendamento|marcar|hor[aá]rio|booking|meeting/.test(m)&&!/consular|visto|visa|vfs/.test(m))return en?'The website booking is a request for a HMATIAS appointment in Luanda or remotely when ap[...]
 if(/projeto|portfolio|portf[oó]lio|trabalho|project|work|experience/.test(m))return en?`Public HMATIAS project examples include ${d.projects.publicExamplesPt.join(', ')}. Client, date and locati[...]
 if(/constru|obra|bet[aã]o|paviment|infraestrutura|construction|infrastructure|paving|concrete|remodel/.test(m))return en?`${d.construction.summaryEn} Main capabilities include concrete and pavin[...]
 if(/facilities|manuten|maintenance|instala[çc]|limpeza empresarial|conserva[çc]/.test(m))return en?`${d.facilities.summaryEn} Services include facility maintenance, one-off interventions, clean[...]
 if(/supply|procurement|sourcing|fornecimento|equipamento|material|fornecedor|supplier/.test(m))return en?`${d.supply.summaryEn} HMATIAS supports national sourcing, Southern Africa research and in[...]
 if(/hmatias clean|produto[s]? de limpeza|cleaning|detergent|detergente|desinfet|higiene|cat[aá]logo|catalogue|catalog/.test(m))return en?`${d.clean.summaryEn} The professional catalogue covers m[...]
 if(/administrativ|documental|business services|business support|apoio empresarial|pm[e]?|carta|declara[çc]|proposta|presentation|apresenta[çc]/.test(m))return en?'HMATIAS Business Services prov[...]
 if(/quem (é|e)|sobre|empresa|company|about|funda|constit|established|founded|ceo|director|lideran/.test(m))return en?`${c.name} is an Angolan services company based in Viana, Luanda, operating s[...]
 if(/contact|telefone|whatsapp|email|e-mail|contacto/.test(m))return en?`HMATIAS contacts: phone/WhatsApp ${c.phone}; general and commercial enquiries, quotations and service requests: ${c.emailCo[...]
 if(/onde|morada|endere[çc]o|localiza|where|address|location|nif|registo|matr[ií]cula|tax id|registration/.test(m))return en?`HMATIAS is based at ${c.location}. Tax ID/NIF ${c.nif}; Commercial R[...]
 if(/pre[çc]o|valor|quanto custa|or[çc]amento|price|cost|quote|quotation/.test(m))return en?'Rates for HMATIAS Business Services are available by quotation only. Product prices, stock and delive[...]
 return null}
async function askAI(message,history){const body={message,history,pageContext:pageContext(),knowledgeVersion:getKB()?.version||null,pageUrl:location.href,pageTitle:document.title,language:enFor(me[...]
function fallback(q){return enFor(q)?'I can answer questions about HMATIAS as published on this website: Construction & Remodelling, Facilities & Maintenance, Supply & Procurement, HMATIAS Clean, [...]
function init(){if(document.querySelector('.hmatias-assistant'))return;const t=pageEn?{label:'HMATIAS Assistant',sub:'Official company, services and quotation information.',close:'Close assistant'[...]
const boot=()=>init();const scheduleBoot=()=>{'requestIdleCallback' in window?requestIdleCallback(boot,{timeout:1500}):setTimeout(boot,350)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleBoot);else scheduleBoot();
})();
