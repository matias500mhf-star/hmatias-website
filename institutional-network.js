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
          ${person.photo ? `<div class="team-card-photo"><img src="${safe(person.photo)}" alt="Retrato profissional de ${safe(person.name)}" loading="lazy"></div>` : `<div class="team-card-photo team-card-photo-placeholder" aria-hidden="true"><span>${safe(String(person.name || "HM").split(/\\s+/).slice(0,2).map((part) => part.charAt(0)).join("").toUpperCase())}</span></div>`}
          <div class="team-card-copy"><span class="eyebrow blue">${safe(person.department)}</span><h3>${safe(person.name)}</h3><p class="team-role">${safe(person.role)}</p><p>${safe(person.bio)}</p><div class="specimen-tags">${(person.specialties || []).map((tag) => `<span>${safe(tag)}</span>`).join("")}</div></div>
        </article>`).join("");
    } catch (error) { console.warn("[HMATIAS] Team profiles unavailable.", error); }
  };
  const renderPartners = async () => {
    const root = document.getElementById("partners-grid");
    if (!root) return;
    try {
      const data = await readJson("data/partners.json");
      const partners = (data.partners || []).filter((partner) => partner.public === true);
      if (!partners.length) return;
      root.innerHTML = partners.map((partner, index) => `
        <article class="partner-card">
          <div class="partner-card-top"><span class="partner-number">0${index + 1}</span><span class="partner-status">${safe(partner.status_label)}</span></div>
          <div class="partner-logo">${partner.logo ? `<img class="partner-logo-img" src="${safe(partner.logo)}" alt="Logótipo oficial de ${safe(partner.name)}" loading="lazy">` : `<span class="partner-logo-pending">Logótipo oficial em validação</span>`}</div>
          <span class="partner-region">${safe(partner.region)}</span>
          <h3>${safe(partner.relationship_type)}</h3>
          <p>${safe(partner.summary)}</p>
          <ul class="partner-capabilities">${(partner.capabilities || []).map((item) => `<li>${safe(item)}</li>`).join("")}</ul>
          <p class="partner-commercial-note">${safe(partner.commercial_note)}</p>
          <div class="partner-card-footer">${partner.website ? `<a href="${safe(partner.website)}" target="_blank" rel="noopener noreferrer">Website oficial ↗</a>` : "<span>Informação comercial sob consulta</span>"}<span>${safe(partner.region)}</span></div>
        </article>`).join("");
    } catch (error) { console.warn("[HMATIAS] Partner network unavailable.", error); }
  };
  const renderCatalogue = async () => {
    const root = document.getElementById("catalogue-grid");
    if (!root) return;
    try {
      const data = await readJson("data/supply-catalog.json");
      const categories = (data.categories || []).filter((category) =>
        category.public !== false && (category.cover_image || category.pdf_url ||
          (category.items || []).some((item) => item.image))
      );
      if (!categories.length) {
        root.innerHTML = `
          <article class="network-empty supply-catalogue-empty">
            <span class="eyebrow blue">CATÁLOGO EM VALIDAÇÃO</span>
            <h3>Referências sem imagem não são apresentadas como produtos.</h3>
            <p>Estamos a validar fotografias de fabricante, capa e páginas técnicas dos catálogos. Até existir material visual e documentação acessível, a HMATIAS recebe pedidos por especificação, sem apresentar cartões genéricos nem sugerir stock.</p>
            <a class="supply-enquire" href="mailto:geral@comercialhmatiasps.com?subject=Consulta%20de%20fornecimento%20HMATIAS">Enviar uma consulta à HMATIAS ↗</a>
          </article>`;
        return;
      }
      root.innerHTML = categories.map((category) => {
        const products = (category.items || []).filter((item) => item.image);
        const cover = category.cover_image
          ? `<img class="supply-catalogue-cover" src="${safe(category.cover_image)}" alt="${safe(category.cover_alt || ("Catálogo " + category.source))}" loading="lazy" decoding="async">`
          : "";
        const productCards = products.map((item) => `
          <article class="supply-product">
            <img src="${safe(item.image)}" alt="${safe(item.image_alt || item.name)}" loading="lazy" decoding="async">
            <div><h4>${safe(item.name)}</h4><p><strong>${safe(item.type)}</strong></p>
            <p>${safe(item.specification)}</p><p>${safe(item.application)}</p></div>
            <a href="mailto:geral@comercialhmatiasps.com?subject=${encodeURIComponent("Consulta HMATIAS — " + item.name)}">Consultar referência ↗</a>
          </article>`).join("");
        const pdfActions = category.pdf_url ? `
          <div class="supply-catalogue-actions">
            <a class="btn btn-primary" href="${safe(category.pdf_url)}" target="_blank" rel="noopener noreferrer">Abrir catálogo PDF ↗</a>
            <a class="btn btn-outline" href="${safe(category.pdf_url)}" download>Descarregar PDF ↓</a>
          </div>` : "";
        return `
          <article class="supply-card supply-catalogue-card">
            ${cover}
            <div class="supply-card-top"><span class="partner-number">${safe(category.source)}</span><span class="partner-status">${safe(category.status_label || "Sob consulta")}</span></div>
            <h3>${safe(category.title)}</h3><p>${safe(category.description)}</p>
            ${category.brands?.length ? `<div class="supply-brands">${category.brands.map((brand) => `<span>${safe(brand)}</span>`).join("")}</div>` : ""}
            ${productCards ? `<div class="supply-products-grid">${productCards}</div>` : ""}
            ${pdfActions}
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