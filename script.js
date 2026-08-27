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

// Mantém o cartão Kent Offshore limpo, sem qualquer logótipo/imagem adicional.
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

// Barra superior: localização fixa + restante da informação em ticker horizontal contínuo.
const topbar = document.querySelector(".topbar");
const topbarInner = document.querySelector(".topbar-inner");
const locationLabel = topbarInner?.querySelector(":scope > span:first-child");
const topLinks = document.querySelector(".top-links");
const topContact = document.querySelector(".top-contact");

if (topbar && topbarInner && topLinks && topContact) {
  topbar.classList.add("hmatias-livebar");
  topbarInner.classList.add("hmatias-livebar-inner");
  locationLabel?.classList.add("hmatias-location");

  topLinks.innerHTML = "";
  topLinks.classList.add("hmatias-ticker");
  topContact.classList.add("hmatias-ticker-contact");

  const tickerItems = [
    "Qualidade",
    "Compromisso",
    "Resultados",
    "☎ +244 948 806 673",
    "✉ geral@hmatiasps.ao",
    "comercial@hmatiasps.ao"
  ];

  const tickerHtml = tickerItems.map(item => `<span class="ticker-item">${item}</span><span class="ticker-sep">•</span>`).join("");
  const track = document.createElement("div");
  track.className = "hmatias-ticker-track";
  track.innerHTML = tickerHtml + tickerHtml;
  topLinks.appendChild(track);

  const style = document.createElement("style");
  style.textContent = `
    .hmatias-livebar{overflow:hidden}
    .hmatias-livebar-inner{gap:18px}
    .hmatias-location{flex:0 0 auto;white-space:nowrap;font-weight:800;color:#fff}
    .hmatias-ticker{position:relative;flex:1;min-width:0;overflow:hidden;height:38px;display:flex!important;align-items:center;white-space:nowrap}
    .hmatias-ticker-track{display:flex;align-items:center;width:max-content;animation:hmatiasTicker 38s linear infinite}
    .ticker-item{display:inline-block;color:#e9f5ff;font-size:11px;font-weight:800;letter-spacing:.12px}
    .ticker-sep{display:inline-block;margin:0 12px;color:#57bdf0;font-size:12px}
    .hmatias-ticker-contact{flex:0 0 auto;display:flex!important;align-items:center}
    .hmatias-ticker-contact a{color:#fff!important}
    .hmatias-livebar:hover .hmatias-ticker-track{animation-play-state:paused}
    @keyframes hmatiasTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    .whatsapp{display:inline-flex;align-items:center;gap:7px;background:#159447;color:#fff!important;border-color:#159447!important;box-shadow:0 6px 16px rgba(21,148,71,.18)}
    .whatsapp::before{content:"↗";font-size:13px;font-weight:900}
    .whatsapp:hover{background:#117b3b!important;border-color:#117b3b!important;transform:translateY(-1px)}
    #fornecedores .service-card.featured .service-icon{background-image:none!important}
    @media(max-width:1100px){.hmatias-livebar-inner{gap:12px}.hmatias-ticker-contact{display:none!important}}
    @media(max-width:850px){.hmatias-livebar{height:34px}.hmatias-livebar-inner{height:34px;justify-content:flex-start}.hmatias-location{font-size:10px}.hmatias-ticker{height:34px}.hmatias-ticker-track{animation-duration:34s}.ticker-item{font-size:10px}.topbar{font-size:10px}.nav-actions{display:none}.whatsapp-float{display:flex!important;align-items:center;gap:7px}}
    @media(prefers-reduced-motion:reduce){.hmatias-ticker-track{animation:none;transform:none}}
  `;
  document.head.appendChild(style);
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
