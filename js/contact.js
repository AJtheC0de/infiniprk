const contactForm = document.querySelector(".contact-form form");
const formStatus = document.querySelector(".form-status");

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.textContent = "Vielen Dank. Ihre Anfrage wurde vorbereitet. Die definitive Formularanbindung wird mit Ihren Kontaktdaten ergänzt.";
  contactForm.reset();
});
