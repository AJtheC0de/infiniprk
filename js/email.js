const emailLinks = document.querySelectorAll("[data-email-link]");
const emailParts = ["infinitys", "gmx", "ch"];
const emailAddress = `${emailParts[0]}${String.fromCharCode(64)}${emailParts[1]}.${emailParts[2]}`;

emailLinks.forEach((link) => {
  link.href = `mailto:${emailAddress}`;
  link.textContent = emailAddress;
});
