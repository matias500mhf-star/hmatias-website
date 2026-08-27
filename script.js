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

  const text =
`Olá HMATIAS.\n\nNome: ${nome}\nEmpresa: ${empresa}\nServiço: ${servico}\n\nMensagem:\n${mensagem}`;

  const phone = "244948806673";
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
});

// Remove qualquer imagem/logo antigo da Kent Offshore aplicado por CSS e mantém apenas o conteúdo correto.
const kentCard = [...document.querySelectorAll(".service-card")].find(card =>
  card.querySelector("h3")?.textContent.trim().toLowerCase() === "kent offshore"
);
if (kentCard) {
  kentCard.querySelectorAll("img").forEach(img => img.remove());
  const icon = kentCard.querySelector(".service-icon");
  if (icon) {
    icon.style.backgroundImage = "none";
    icon.style.background = "#eaf4fd";
    icon.textContent = "◎";
  }
}

// Cabeçalho com ticker horizontal em andamento, mantendo a localização fixa.
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

  const tickerItems = [
    "Qualidade",
    "Compromisso",
    "Resultados",
    "Construção & Infraestrutura",
    "Facilities & Manutenção",
    "HMATIAS Supply · Procurement",
    "Fornecimento Empresarial",
    "Projetos reais · HMATIAS",
    "Parcerias & Soluções Empresariais",
    "☎ +244 948 806 673",
    "✉ geral@hmatiasps.ao",
    "✉ comercial@hmatiasps.ao"
  ];
  const tickerMarkup = tickerItems.map((item, i) => `${i ? '<span class="ticker-sep">•</span>' : ''}<span class="ticker-item">${item}</span>`).join("");
  topLinks.innerHTML = `<div class="hmatias-ticker-track">${tickerMarkup}${tickerMarkup}</div>`;

  if (topContact) topContact.style.display = "none";

  const style = document.createElement("style");
  style.textContent = `
    .hmatias-livebar{overflow:hidden}
    .hmatias-livebar-inner{gap:20px}
    .hmatias-location{flex:0 0 auto;white-space:nowrap;font-weight:800;color:#fff}
    .hmatias-ticker{position:relative;flex:1;min-width:0;overflow:hidden;height:38px;display:flex!important;align-items:center;white-space:nowrap}
    .hmatias-ticker-track{display:inline-flex;align-items:center;min-width:max-content;animation:hmatiasTicker 42s linear infinite;will-change:transform}
    .ticker-item{display:inline-block;color:#e9f5ff;font-size:11px;font-weight:700;letter-spacing:.08px}
    .ticker-sep{display:inline-block;margin:0 13px;color:#58b8e8;font-size:10px}
    .hmatias-livebar:hover .hmatias-ticker-track{animation-play-state:paused}
    @keyframes hmatiasTicker{from{transform:translateX(0)}to{transform:translateX(-50%)} }
    .whatsapp{display:inline-flex;align-items:center;gap:7px;background:#159447;color:#fff!important;border:1px solid #159447!important;box-shadow:0 7px 18px rgba(21,148,71,.16)}
    .whatsapp::before{content:"↗";font-size:12px;font-weight:900}
    .whatsapp:hover{background:#117b3b!important;border-color:#117b3b!important;transform:translateY(-1px)}
    #fornecedores .service-card.featured .service-icon{background-image:none!important}
    /* Premium visual finish: cleaner whites, crisper text, lighter depth, stronger photographic clarity. */
    body{font-synthesis:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    .header{background:rgba(255,255,255,.985);box-shadow:0 2px 18px rgba(6,45,86,.045)}
    .brand img{filter:contrast(1.03) saturate(1.02)}
    .hero-photo img{filter:saturate(1.03) contrast(1.06) brightness(1.015)}
    .visual-card:before{background:linear-gradient(90deg,rgba(6,45,86,.84) 0%,rgba(6,45,86,.30) 46%,rgba(6,45,86,.02) 100%),linear-gradient(180deg,rgba(6,45,86,.02) 35%,rgba(6,45,86,.48) 100%)}
    .visual-overlay{background:rgba(6,45,86,.90);backdrop-filter:blur(7px);box-shadow:0 10px 28px rgba(0,0,0,.16)}
    .service-card,.sector-grid article,.why-us-grid article,.project,.contact-form{box-shadow:0 8px 26px rgba(6,45,86,.055)}
    .service-card:hover,.sector-grid article:hover{box-shadow:0 14px 32px rgba(6,45,86,.085)}
    .service-card,.sector-grid article,.why-us-grid article,.project,.contact-form{border-color:#e2eaf2}
    .service-card.featured{background:linear-gradient(145deg,#f8fcff,#fff);border-color:#add8f5}
    .company-panel{box-shadow:0 18px 44px rgba(6,45,86,.14)}
    .supply-card{box-shadow:0 14px 38px rgba(0,0,0,.10)}
    .cta{background:linear-gradient(180deg,#f4f9fd,#edf5fb)}
    .contact{background:#f7fafc}
    .footer-logo{filter:brightness(0) invert(1) contrast(1.08)}
    .whatsapp-float{box-shadow:0 10px 26px rgba(21,148,71,.24)}
    .whatsapp-float:hover{box-shadow:0 14px 30px rgba(21,148,71,.28)}
    @media(min-width:851px){.hmatias-livebar{letter-spacing:.08px}.nav-menu a{letter-spacing:.08px}}
    @media(max-width:1100px){.hmatias-livebar-inner{gap:14px}}
    @media(max-width:850px){.hmatias-livebar{height:34px}.hmatias-livebar-inner{height:34px;justify-content:flex-start}.hmatias-location{font-size:10px}.hmatias-ticker{height:34px}.hmatias-ticker-track{animation-duration:34s}.ticker-item{font-size:10px}.topbar{font-size:10px}.nav-actions{display:none}.whatsapp-float{display:flex!important;align-items:center;gap:7px}}
  `;
  document.head.appendChild(style);
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
