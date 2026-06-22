const contactForm = document.querySelector(".contact-form form");
const formStatus = document.querySelector(".form-status");
const submitButton = contactForm?.querySelector(".form-submit");
const formLoadedAt = Date.now();
const rateLimitKey = "infinitys-contact-last-submit";
const rateLimitWindow = 60 * 1000;
const minimumSubmitTime = 4000;

const setStatus = (message) => {
  if (formStatus) {
    formStatus.textContent = message;
  }
};

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const honeypot = formData.get("website");
  const submittedTooFast = Date.now() - formLoadedAt < minimumSubmitTime;
  let lastSubmit = 0;

  try {
    lastSubmit = Number(window.localStorage.getItem(rateLimitKey) || 0);
  } catch {
    lastSubmit = 0;
  }

  const submittedTooOften = Date.now() - lastSubmit < rateLimitWindow;

  if (honeypot || submittedTooFast || submittedTooOften) {
    setStatus("Die Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.");
    return;
  }

  formData.set("startedAt", String(formLoadedAt));
  formData.set("submittedAt", String(Date.now()));
  formData.set("page", window.location.href);

  if (submitButton) {
    submitButton.disabled = true;
  }
  setStatus("Ihre Anfrage wird gesendet.");

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(formData),
    });

    if (!response.ok) {
      throw new Error("Request rejected");
    }

    try {
      window.localStorage.setItem(rateLimitKey, String(Date.now()));
    } catch {
      // The form can still complete when browser storage is unavailable.
    }

    setStatus("Vielen Dank. Ihre Anfrage wurde gesendet.");
    contactForm.reset();
  } catch {
    setStatus("Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut oder rufen Sie uns an.");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
});
