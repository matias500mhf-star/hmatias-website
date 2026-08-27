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
    "Construção & Infraestrutura",
    "Facilities & Manutenção",
    "HMATIAS Supply · Procurement",
    "Fornecimento Empresarial",
    "Projetos reais · HMATIAS",
    "Parcerias & Soluções Empresariais"
  ];
  topLinks.innerHTML = `<div class="hmatias-ticker-track">${tickerItems.map((item, i) => `${i ? '<span class="ticker-sep">•</span>' : ''}<span class="ticker-item">${item}</span>`).join("")}</div>`;

  if (topContact) topContact.classList.add("hmatias-top-contact");

  const style = document.createElement("style");
  style.textContent = `
    .hmatias-livebar{overflow:hidden}
    .hmatias-livebar-inner{gap:22px}
    .hmatias-location{flex:0 0 auto;white-space:nowrap;font-weight:800;color:#fff}
    .hmatias-ticker{position:relative;flex:1;min-width:0;overflow:hidden;height:38px;display:flex!important;align-items:center;white-space:nowrap}
    .hmatias-ticker-track{display:inline-flex;align-items:center;min-width:max-content;animation:hmatiasTicker 28s linear infinite}
    .ticker-item{display:inline-block;color:#e9f5ff;font-size:11px;font-weight:800;letter-spacing:.15px}
    .ticker-sep{display:inline-block;margin:0 13px;color:#57bdf0;font-size:12px}
    .hmatias-top-contact{flex:0 0 auto}
    .hmatias-livebar:hover .hmatias-ticker-track{animation-play-state:paused}
    @keyframes hmatiasTicker{from{transform:translateX(0)}to{transform:translateX(-50%)} }
    .whatsapp{display:inline-flex;align-items:center;gap:7px;background:#159447;color:#fff!important;border-color:#159447!important;box-shadow:0 6px 16px rgba(21,148,71,.18)}
    .whatsapp::before{content:"↗";font-size:13px;font-weight:900}
    .whatsapp:hover{background:#117b3b!important;border-color:#117b3b!important;transform:translateY(-1px)}
    #fornecedores .service-card.featured .service-icon{background-image:none!important}
    @media(max-width:1100px){.hmatias-livebar-inner{gap:14px}.hmatias-top-contact{display:none}}
    @media(max-width:850px){.hmatias-livebar{height:34px}.hmatias-livebar-inner{height:34px;justify-content:flex-start}.hmatias-location{font-size:10px}.hmatias-ticker{height:34px}.hmatias-ticker-track{animation-duration:24s}.ticker-item{font-size:10px}.topbar{font-size:10px}.nav-actions{display:none}.whatsapp-float{display:flex!important;align-items:center;gap:7px}}
  `;
  document.head.appendChild(style);
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
