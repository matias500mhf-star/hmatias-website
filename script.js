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

// Kent Offshore: acrescenta o logótipo oficial no cartão de fornecedor sem alterar o layout existente.
const kentCard = [...document.querySelectorAll(".service-card")].find(card =>
  card.querySelector("h3")?.textContent.trim().toLowerCase() === "kent offshore"
);
if (kentCard) {
  const logo = document.createElement("img");
  logo.src = "https://kentoffshore.com/wp-content/uploads/2023/06/logo-kent-offshore.png";
  logo.alt = "Kent Offshore";
  logo.loading = "lazy";
  logo.decoding = "async";
  logo.style.cssText = "display:block;width:auto;max-width:210px;height:54px;object-fit:contain;object-position:left center;margin:0 0 18px;";
  kentCard.insertBefore(logo, kentCard.querySelector("h3"));

  const contact = document.createElement("p");
  contact.innerHTML = '<strong>Contacto comercial na Namíbia: Abisai Shikongo</strong>';
  const existing = [...kentCard.querySelectorAll("p")].find(p => p.textContent.includes("Contacto comercial"));
  if (!existing) kentCard.insertBefore(contact, kentCard.querySelector("p"));
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
