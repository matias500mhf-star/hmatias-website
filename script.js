const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

menuToggle?.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

document.querySelectorAll(".nav-menu a").forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const form = document.getElementById("contactForm");
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const nome = data.get("nome");
  const empresa = data.get("empresa") || "Não indicada";
  const servico = data.get("servico");
  const mensagem = data.get("mensagem");
  const text = `Olá HMATIAS.\n\nNome: ${nome}\nEmpresa: ${empresa}\nServiço: ${servico}\n\nMensagem:\n${mensagem}`;
  const phone = "244948806673";
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
});

const kentCard = [...document.querySelectorAll(".service-card")].find(card => card.querySelector("h3")?.textContent.trim().toLowerCase() === "kent offshore");
if (kentCard) {
  kentCard.querySelectorAll("img").forEach(img => img.remove());
  const icon = kentCard.querySelector(".service-icon");
  if (icon) {
    icon.style.backgroundImage = "none";
    icon.style.background = "#eaf4fd";
    icon.textContent = "◎";
  }
}

const topbar = document.querySelector(".topbar");
const topbarInner = document.querySelector(".topbar-inner");
const locationLabel = topbarInner?.querySelector(":scope > span:first-child");
const topLinks = document.querySelector(".top-links");
const topContact = document.querySelector(".top-contact");

if (topbar && topbarInner && topLinks) {
  topbar.classList.add("hmatias-livebar");
  topbarInner.classList.add("hmatias-livebar-inner");
  if (locationLabel) locationLabel.classList.add("hmatias-location");
  topLinks.classList.add("hmatias-ticker");
  const tickerItems = ["Construção & Infraestrutura","Facilities & Manutenção","HMATIAS Supply · Procurement","Fornecimento Empresarial","Projetos reais · HMATIAS","Parcerias & Soluções Empresariais"];
  const tickerMarkup = tickerItems.map(item => `<span class="ticker-item">${item}</span><span class="ticker-sep">•</span>`).join("");
  topLinks.innerHTML = `<div class="hmatias-ticker-track">${tickerMarkup}${tickerMarkup}</div>`;
  if (topContact) topContact.classList.add("hmatias-top-contact");
  const style = document.createElement("style");
  style.textContent = `
    .hmatias-livebar{overflow:hidden}.hmatias-livebar-inner{gap:22px}.hmatias-location{flex:0 0 auto;white-space:nowrap;font-weight:800;color:#fff}.hmatias-ticker{position:relative;flex:1;min-width:0;overflow:hidden;height:38px;display:flex!important;align-items:center;white-space:nowrap}.hmatias-ticker-track{display:inline-flex;align-items:center;min-width:max-content;animation:hmatiasTicker 34s linear infinite}.ticker-item{display:inline-block;color:#e9f5ff;font-size:11px;font-weight:800;letter-spacing:.15px}.ticker-sep{display:inline-block;margin:0 13px;color:#57bdf0;font-size:12px}.hmatias-top-contact{flex:0 0 auto}.hmatias-livebar:hover .hmatias-ticker-track{animation-play-state:paused}@keyframes hmatiasTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}.whatsapp{display:inline-flex;align-items:center;gap:7px;background:#159447;color:#fff!important;border-color:#159447!important;box-shadow:0 6px 16px rgba(21,148,71,.18)}.whatsapp::before{content:"↗";font-size:13px;font-weight:900}.whatsapp:hover{background:#117b3b!important;border-color:#117b3b!important;transform:translateY(-1px)}#fornecedores .service-card.featured .service-icon{background-image:none!important}.nav-menu a.active{color:var(--blue);border-color:var(--blue)}.hmatias-backtop{position:fixed;left:16px;top:112px;z-index:55;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.94);border:1px solid var(--border);box-shadow:0 8px 22px rgba(6,45,86,.12);color:var(--blue);font-size:18px;font-weight:900;opacity:0;pointer-events:none;transform:translateY(-6px);transition:opacity .25s,transform .25s}.hmatias-backtop.show{opacity:1;pointer-events:auto;transform:translateY(0)}.hmatias-backtop:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(6,45,86,.16)}@media(max-width:1100px){.hmatias-livebar-inner{gap:14px}.hmatias-top-contact{display:none}}@media(max-width:850px){.hmatias-livebar{height:34px}.hmatias-livebar-inner{height:34px;justify-content:flex-start}.hmatias-location{font-size:10px}.hmatias-ticker{height:34px}.hmatias-ticker-track{animation-duration:28s}.ticker-item{font-size:10px}.topbar{font-size:10px}.nav-actions{display:none}.whatsapp-float{display:flex!important;align-items:center;gap:7px}.hmatias-backtop{left:10px;top:94px;width:34px;height:34px}}
  `;
  document.head.appendChild(style);
}

const navLinks = [...document.querySelectorAll('.nav-menu a[href^="#"]')];
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const setActiveNav = (id) => navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
if (sections.length) {
  const navObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActiveNav(visible.target.id);
  }, {rootMargin:'-28% 0px -58% 0px',threshold:[0.05,0.15,0.3,0.5]});
  sections.forEach(section => navObserver.observe(section));
}

const backTop = document.createElement('button');
backTop.className = 'hmatias-backtop';
backTop.type = 'button';
backTop.setAttribute('aria-label', 'Voltar ao início');
backTop.innerHTML = '↑';
backTop.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));
document.body.appendChild(backTop);
window.addEventListener('scroll', () => backTop.classList.toggle('show', window.scrollY > 260), {passive:true});

// Camada visual premium 2.0 carregada sem alterar a estrutura do HTML.
if (!document.querySelector('link[data-hmatias-premium]')) {
  const premium = document.createElement('link');
  premium.rel = 'stylesheet';
  premium.href = 'premium.css?v=2';
  premium.dataset.hmatiasPremium = 'true';
  document.head.appendChild(premium);
}

// HMATIAS AI Assistant — interface autónoma ligada ao Worker Cloudflare.
(() => {
  if (document.getElementById('hmatias-ai')) return;
  const AI_ENDPOINT = 'https://app.comercialhmatiasps.com/api/ai';
  const state = {open:false,busy:false,messages:[]};

  const style = document.createElement('style');
  style.textContent = `
    #hmatias-ai{position:fixed;left:20px;bottom:20px;z-index:70;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
    #hmatias-ai-launcher{border:0;border-radius:999px;background:#062d56;color:#fff;padding:13px 18px;display:inline-flex;align-items:center;gap:9px;box-shadow:0 14px 34px rgba(6,45,86,.25);font:800 12px inherit;cursor:pointer;transition:transform .2s,box-shadow .2s}
    #hmatias-ai-launcher:hover{transform:translateY(-2px);box-shadow:0 18px 38px rgba(6,45,86,.30)}
    #hmatias-ai-launcher .ai-dot{width:8px;height:8px;border-radius:50%;background:#55bdf4;box-shadow:0 0 0 4px rgba(85,189,244,.14)}
    #hmatias-ai-panel{position:absolute;left:0;bottom:58px;width:min(390px,calc(100vw - 28px));height:min(570px,calc(100vh - 110px));background:#fff;border:1px solid #dce6f0;border-radius:18px;box-shadow:0 24px 70px rgba(6,45,86,.22);overflow:hidden;display:none;flex-direction:column}
    #hmatias-ai.open #hmatias-ai-panel{display:flex}
    .hmatias-ai-head{background:linear-gradient(135deg,#062d56,#075f9f);color:#fff;padding:17px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .hmatias-ai-brand{display:flex;align-items:center;gap:11px}.hmatias-ai-mark{width:36px;height:36px;border-radius:11px;background:rgba(255,255,255,.12);display:grid;place-items:center;font-weight:900;color:#75c8f7}.hmatias-ai-head strong{display:block;font-size:14px}.hmatias-ai-head small{display:block;color:#cce0ee;font-size:10px;margin-top:2px}.hmatias-ai-close{border:0;background:transparent;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:4px}
    .hmatias-ai-body{flex:1;padding:15px;overflow:auto;background:#f7fafd;display:flex;flex-direction:column;gap:10px}.hmatias-ai-msg{max-width:84%;padding:10px 12px;border-radius:13px;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word}.hmatias-ai-msg.bot{align-self:flex-start;background:#fff;border:1px solid #dce6f0;color:#23405e;border-bottom-left-radius:5px}.hmatias-ai-msg.user{align-self:flex-end;background:#0065cc;color:#fff;border-bottom-right-radius:5px}
    .hmatias-ai-typing{display:inline-flex;gap:4px;align-items:center}.hmatias-ai-typing i{width:5px;height:5px;border-radius:50%;background:#7891aa;animation:hmatiasAiBlink 1s infinite ease-in-out}.hmatias-ai-typing i:nth-child(2){animation-delay:.15s}.hmatias-ai-typing i:nth-child(3){animation-delay:.3s}@keyframes hmatiasAiBlink{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
    .hmatias-ai-foot{border-top:1px solid #dce6f0;background:#fff;padding:10px;display:flex;gap:8px}.hmatias-ai-input{flex:1;resize:none;border:1px solid #d8e2ec;border-radius:10px;padding:10px 11px;min-height:42px;max-height:100px;font:inherit;font-size:12px;outline:0}.hmatias-ai-input:focus{border-color:#0065cc;box-shadow:0 0 0 3px rgba(0,101,204,.08)}.hmatias-ai-send{border:0;border-radius:10px;background:#0065cc;color:#fff;padding:0 14px;font-weight:900;font-size:12px;cursor:pointer}.hmatias-ai-send:disabled{opacity:.5;cursor:not-allowed}.hmatias-ai-note{padding:0 12px 11px;background:#fff;color:#7a8b9b;font-size:9px;text-align:center}
    @media(max-width:560px){#hmatias-ai{left:14px;bottom:14px}.hmatias-ai-msg{max-width:88%}}@media(prefers-reduced-motion:reduce){#hmatias-ai-launcher{transition:none}.hmatias-ai-typing i{animation:none}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'hmatias-ai';
  root.innerHTML = `
    <div id="hmatias-ai-panel" role="dialog" aria-label="Assistente virtual HMATIAS" aria-modal="false">
      <div class="hmatias-ai-head"><div class="hmatias-ai-brand"><div class="hmatias-ai-mark">✦</div><div><strong>Assistente HMATIAS</strong><small>Atendimento virtual · Respostas sobre a empresa</small></div></div><button class="hmatias-ai-close" type="button" aria-label="Fechar assistente">×</button></div>
      <div class="hmatias-ai-body" aria-live="polite"></div>
      <div class="hmatias-ai-foot"><textarea class="hmatias-ai-input" rows="1" maxlength="1200" placeholder="Como podemos ajudar?"></textarea><button class="hmatias-ai-send" type="button">Enviar</button></div>
      <div class="hmatias-ai-note">Assistente virtual. Para orçamento, proposta ou confirmação comercial, fale com a equipa HMATIAS.</div>
    </div>
    <button id="hmatias-ai-launcher" type="button" aria-expanded="false" aria-controls="hmatias-ai-panel"><span class="ai-dot"></span> Assistente HMATIAS</button>
  `;
  document.body.appendChild(root);

  const launcher = root.querySelector('#hmatias-ai-launcher');
  const panel = root.querySelector('#hmatias-ai-panel');
  const close = root.querySelector('.hmatias-ai-close');
  const body = root.querySelector('.hmatias-ai-body');
  const input = root.querySelector('.hmatias-ai-input');
  const send = root.querySelector('.hmatias-ai-send');
  const scrollBottom = () => { body.scrollTop = body.scrollHeight; };
  const addMessage = (role, content) => { const el=document.createElement('div'); el.className=`hmatias-ai-msg ${role}`; el.textContent=content; body.appendChild(el); scrollBottom(); };
  const setTyping = (show) => { const existing=body.querySelector('.hmatias-ai-typing-msg'); if(show&&!existing){const el=document.createElement('div');el.className='hmatias-ai-msg bot hmatias-ai-typing-msg';el.innerHTML='<span class="hmatias-ai-typing"><i></i><i></i><i></i></span>';body.appendChild(el);scrollBottom();}else if(!show&&existing)existing.remove(); };
  const setOpen = (open) => { state.open=open; root.classList.toggle('open',open); launcher.setAttribute('aria-expanded',String(open)); if(open&&!state.messages.length){const greeting='Olá! Sou o Assistente HMATIAS. Posso explicar os nossos serviços, Supply, construção, facilities e formas de contacto. Em que posso ajudar?';state.messages.push({role:'assistant',content:greeting});addMessage('bot',greeting);} if(open)setTimeout(()=>input.focus(),80); };
  const sendMessage = async () => {
    if(state.busy)return; const message=input.value.trim(); if(!message)return; state.busy=true;send.disabled=true;input.disabled=true;state.messages.push({role:'user',content:message});addMessage('user',message);input.value='';setTyping(true);
    try { const history=state.messages.slice(-7); const response=await fetch(AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history})}); const data=await response.json().catch(()=>({})); if(!response.ok)throw new Error(data?.error||'Não foi possível obter uma resposta.'); const answer=typeof data.answer==='string'?data.answer.trim():''; if(!answer)throw new Error('Resposta vazia do assistente.'); state.messages.push({role:'assistant',content:answer});setTyping(false);addMessage('bot',answer); }
    catch(error){setTyping(false);addMessage('bot',`Não consegui responder neste momento. Pode contactar a HMATIAS pelo WhatsApp +244 948 806 673.\n\n${error?.message||'Serviço temporariamente indisponível.'}`);}
    finally{state.busy=false;send.disabled=false;input.disabled=false;input.focus();scrollBottom();}
  };
  launcher.addEventListener('click',()=>setOpen(!state.open)); close.addEventListener('click',()=>setOpen(false)); send.addEventListener('click',sendMessage); input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage();}});
})();

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
