(() => {
  "use strict";
  const readJson = async (path) => {
    const response = await fetch(path, { credentials: "same-origin" });
    if (!response.ok) throw new Error("Não foi possível carregar " + path);
    return response.json();
  };
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const renderTeam = async () => {
    const root = document.getElementById("team-grid");
    if (!root) return;
    try {
      const data = await readJson("data/team.json");
      const profiles = (data.profiles || []).filter((person) => person.approved === true && person.public === true);
      if (!profiles.length) return;
      root.innerHTML = profiles.map((person) => `
        <article class="team-card">
          ${person.photo ? `<div class="team-card-photo"><img src="${safe(person.photo)}" alt="Retrato profissional de ${safe(person.name)}" loading="lazy"></div>` : `<div class="team-card-photo team-card-photo-placeholder" aria-hidden="true"><span>${safe(String(person.name || "HM").split(/\s+/).slice(0,2).map((part) => part.charAt(0)).join("").toUpperCase())}</span></div>`}
          <div class="team-card-copy"><span class="eyebrow blue">${safe(person.department)}</span><h3>${safe(person.name)}</h3><p class="team-role">${safe(person.role)}</p><p>${safe(person.bio)}</p><div class="specimen-tags">${(person.specialties || []).map((tag) => `<span>${safe(tag)}</span>`).join("")}</div></div>
        </article>`).join("");
    } catch (error) { console.warn("[HMATIAS] Team profiles unavailable.", error); }
  };
  const renderPartners = async () => {
    const root = document.getElementById("partners-grid");
    if (!root) return;
    try {
      const data = await readJson("data/partners.json");
      const partners = (data.partners || []).filter((partner) => partner.public === true && partner.name && partner.logo);
      if (!partners.length) {
        root.innerHTML = '<div class="network-empty"><h3>Registos de parceiros em actualização</h3><p>A informação será apresentada quando estiver confirmada.</p></div>';
        return;
      }
      root.innerHTML = partners.map((partner) => `
        <article class="partner-card partner-card--logo">
          <div class="partner-logo"><img class="partner-logo-img" src="${safe(partner.logo)}" alt="Logótipo oficial de ${safe(partner.name)}" loading="lazy" decoding="async"></div>
          <h3 class="partner-wordmark">${safe(partner.name)}</h3>
        </article>`).join("");
    } catch (error) {
      root.innerHTML = '<div class="network-empty"><h3>Não foi possível carregar a rede de parceiros.</h3><p>Contacte a HMATIAS para informação institucional.</p></div>';
      console.warn("[HMATIAS] Partner network unavailable.", error);
    }
  };
  const renderCatalogue = async () => {
    const root = document.getElementById("catalogue-grid");
    if (!root) return;
    try {
      const data = await readJson("data/supply-catalog.json");
      const categories = (data.categories || []).filter((category) => category.public !== false && (category.items || []).length > 0);
      if (!categories.length) {
        const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
        const formTarget = isEnglish ? "#supply-request" : "#pedido-supply";
        root.innerHTML = `
          <article class="network-empty supply-catalogue-empty">
            <span class="eyebrow blue">${isEnglish ? "CATALOGUE UNDER REVIEW" : "CATÁLOGO EM VALIDAÇÃO"}</span>
            <h3>${isEnglish ? "Only documented product families and references are displayed." : "Apresentamos apenas famílias e referências de produtos documentadas."}</h3>
            <p>${isEnglish ? "The product selection is being updated. You can still submit a specific supply requirement to HMATIAS." : "A selecção comercial está em actualização. Pode enviar à HMATIAS um pedido de fornecimento específico."}</p>
            <div class="supply-catalogue-actions">
              <a class="btn btn-primary" href="${formTarget}">${isEnglish ? "Submit a supply enquiry" : "Enviar pedido de fornecimento"} ↗</a>
              <a class="btn btn-outline" href="source-ao/rfq.html${isEnglish ? "?lang=en" : ""}">${isEnglish ? "Register a tracked RFQ" : "Registar pedido de cotação"} ↗</a>
            </div>
          </article>`;
        return;
      }
      root.innerHTML = categories.map((category) => {
        const products = (category.items || []);
        const cover = category.cover_image
          ? `<img class="supply-catalogue-cover" src="${safe(category.cover_image)}" alt="${safe(category.cover_alt || ("Imagem da família " + category.title))}" loading="lazy" decoding="async">`
          : "";
        const productCards = products.map((item) => `
          <article class="supply-product">
            ${item.image_position && item.image ? `<div class="supply-product-photo" role="img" aria-label="${safe(item.image_alt || item.name)}" style="background-position:${["0% 0%","100% 0%","0% 100%","100% 100%"].includes(item.image_position) ? item.image_position : "0% 0%"}"></div>` : item.image ? `<img src="${safe(item.image)}" alt="${safe(item.image_alt || item.name)}" loading="lazy" decoding="async">` : `<div class="supply-product-reference" aria-hidden="true"><span>REFERÊNCIA DE PRODUTO</span><strong>${safe(item.name)}</strong></div>`}
            <div><h4>${safe(item.name)}</h4><p><strong>${safe(item.type)}</strong></p>
            <p>${safe(item.specification)}</p><p>${safe(item.application)}</p></div>
            <a href="mailto:geral@comercialhmatiasps.com?subject=${encodeURIComponent("Consulta HMATIAS — " + item.name)}">Consultar referência ↗</a>
          </article>`).join("");
        return `
          <article class="supply-card supply-catalogue-card">
            ${cover}
            <div class="supply-card-top"><span class="partner-number">MARCAS DOS PRODUTOS · ${safe((category.brands || []).join(" · ") || "REFERÊNCIAS SOB CONSULTA")}</span><span class="partner-status">${safe(category.status_label || "Sob consulta")}</span></div>
            <h3>${safe(category.title)}</h3><p>${safe(category.description)}</p>
            ${category.brands?.length ? `<div class="supply-brands">${category.brands.map((brand) => `<span>${safe(brand)}</span>`).join("")}</div>` : ""}
            ${productCards ? `<div class="supply-products-grid">${productCards}</div>` : ""}
            
            <p class="supply-note">${safe(category.quote_note || "Preço, disponibilidade, prazo e condições são confirmados por pedido.")}</p>
            <a class="supply-enquire" href="mailto:geral@comercialhmatiasps.com?subject=${encodeURIComponent("Consulta de fornecimento HMATIAS — " + category.title)}">Pedir cotação à HMATIAS ↗</a>
          </article>`;
      }).join("");
    } catch (error) {
      root.innerHTML = '<div class="network-empty"><h3>Catálogo temporariamente indisponível</h3><p>Contacte a HMATIAS para uma consulta de fornecimento.</p></div>';
      console.warn("[HMATIAS] Supply catalogue unavailable.", error);
    }
  };
  document.addEventListener("DOMContentLoaded", () => { renderTeam(); renderPartners(); renderCatalogue(); });
})();