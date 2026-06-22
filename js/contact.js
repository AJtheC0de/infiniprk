const contactForm = document.querySelector(".contact-form form");
const formStatus = document.querySelector(".form-status");
const formLoadedAt = Date.now();
const rateLimitKey = "infinitys-contact-last-submit";
const rateLimitWindow = 60 * 1000;

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const honeypot = formData.get("website");
  const submittedTooFast = Date.now() - formLoadedAt < 3000;
  let lastSubmit = 0;

  try {
    lastSubmit = Number(window.localStorage.getItem(rateLimitKey) || 0);
  } catch {
    lastSubmit = 0;
  }

  const submittedTooOften = Date.now() - lastSubmit < rateLimitWindow;

  if (honeypot || submittedTooFast || submittedTooOften) {
    formStatus.textContent = "Die Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.";
    return;
  }

  try {
    window.localStorage.setItem(rateLimitKey, String(Date.now()));
  } catch {
    // The form can still proceed when browser storage is unavailable.
  }

  formStatus.textContent = "Vielen Dank. Ihre Anfrage wurde vorbereitet. Die definitive Formularanbindung wird mit Ihren Kontaktdaten ergänzt.";
  contactForm.reset();
});
