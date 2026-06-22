const mailLinks = document.querySelectorAll("[data-mail-link]");
const localPart = [105, 110, 102, 105, 110, 105, 116, 121, 115];
const hostPart = [103, 109, 120];
const tldPart = [99, 104];
const decode = (codes) => String.fromCharCode(...codes);
const mailAddress = `${decode(localPart)}${String.fromCharCode(64)}${decode(hostPart)}.${decode(tldPart)}`;
const mailScheme = ["mai", "lto", ":"].join("");

mailLinks.forEach((link) => {
  link.href = `${mailScheme}${mailAddress}`;
  link.textContent = mailAddress;
});
