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
          <div class="partner-wordmark">${safe(partner.name)}</div>
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
      root.innerHTML = (data.categories || []).map((category, index) => `
        <article class="supply-card">
          <div class="supply-card-top"><span class="partner-number">0${index + 1}</span><span class="partner-status">${safe(category.status_label)}</span></div>
          <span class="eyebrow blue">${safe(category.source)}</span><h3>${safe(category.title)}</h3><p>${safe(category.description)}</p>
          ${category.brands?.length ? `<div class="supply-brands">${category.brands.map((brand) => `<span>${safe(brand)}</span>`).join("")}</div>` : ""}
          ${category.items?.length ? `<div class="supply-items">${category.items.map((item) => `<details><summary>${safe(item.name)}</summary><p><strong>${safe(item.type)}</strong><br>${safe(item.specification)}<br>${safe(item.application)}</p></details>`).join("")}</div>` : ""}
          <p class="supply-note">${safe(category.quote_note)}</p>
          <a class="supply-enquire" href="mailto:geral@comercialhmatiasps.com?subject=Consulta%20de%20fornecimento%20HMATIAS">Consultar esta categoria ↗</a>
        </article>`).join("");
    } catch (error) { console.warn("[HMATIAS] Supply catalogue unavailable.", error); }
  };
  document.addEventListener("DOMContentLoaded", () => { renderTeam(); renderPartners(); renderCatalogue(); });
})();