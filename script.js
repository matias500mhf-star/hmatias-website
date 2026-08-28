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

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
