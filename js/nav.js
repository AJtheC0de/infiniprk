const header = document.querySelector(".site-header");
const servicesNav = document.querySelector(".nav-services");
const servicesToggle = servicesNav?.querySelector(".nav-link");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const mobileAccordionToggle = document.querySelector(".mobile-accordion-toggle");
const mobileSubmenu = document.querySelector(".mobile-submenu");
let dropdownCloseTimer;
const whatsappNumber = "41763882032";

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 80);
};

const openDropdown = () => {
  clearTimeout(dropdownCloseTimer);
  servicesNav?.classList.add("is-open");
  servicesToggle?.setAttribute("aria-expanded", "true");
};

const closeDropdown = () => {
  dropdownCloseTimer = window.setTimeout(() => {
    servicesNav?.classList.remove("is-open");
    servicesToggle?.setAttribute("aria-expanded", "false");
  }, 200);
};

const setMobileMenuState = (isOpen) => {
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  menuToggle?.setAttribute("aria-label", isOpen ? "Menü schliessen" : "Menü öffnen");
  mobileMenu?.setAttribute("aria-hidden", String(!isOpen));
  mobileMenu?.toggleAttribute("inert", !isOpen);
  document.body.classList.toggle("menu-open", isOpen);
};

servicesNav?.addEventListener("mouseenter", openDropdown);
servicesNav?.addEventListener("mouseleave", closeDropdown);
servicesNav?.addEventListener("focusin", openDropdown);
servicesNav?.addEventListener("focusout", closeDropdown);
servicesToggle?.addEventListener("click", (event) => {
  event.preventDefault();
  servicesNav.classList.contains("is-open") ? closeDropdown() : openDropdown();
});

menuToggle?.addEventListener("click", () => {
  const isOpen = mobileMenu?.classList.toggle("is-open");
  setMobileMenuState(Boolean(isOpen));
});

mobileAccordionToggle?.addEventListener("click", () => {
  const isOpen = mobileSubmenu?.classList.toggle("is-open");
  mobileAccordionToggle.setAttribute("aria-expanded", String(isOpen));
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("is-open");
    setMobileMenuState(false);
  });
});

if (!document.querySelector(".whatsapp-float")) {
  const whatsappButton = document.createElement("a");
  whatsappButton.className = "whatsapp-float";
  whatsappButton.href = `https://wa.me/${whatsappNumber}`;
  whatsappButton.target = "_blank";
  whatsappButton.rel = "noopener noreferrer";
  whatsappButton.setAttribute("aria-label", "WhatsApp Chat öffnen");
  whatsappButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.04 4.05a7.9 7.9 0 0 0-6.8 11.92l-.86 3.14 3.2-.84a7.9 7.9 0 1 0 4.46-14.22Zm0 1.55a6.35 6.35 0 0 1 5.38 9.72 6.35 6.35 0 0 1-8.96 1.58l-.27-.18-1.9.5.51-1.84-.2-.29a6.35 6.35 0 0 1 5.44-9.49Zm-2.72 3.12c-.14 0-.38.05-.58.27-.2.22-.76.74-.76 1.8s.78 2.1.9 2.24c.11.14 1.52 2.42 3.78 3.29 1.87.74 2.25.59 2.66.55.41-.04 1.32-.54 1.5-1.06.19-.52.19-.97.13-1.06-.05-.1-.2-.15-.42-.26-.22-.11-1.31-.65-1.52-.72-.2-.08-.35-.11-.5.11-.14.22-.58.72-.71.87-.13.14-.26.16-.48.05-.22-.11-.93-.34-1.78-1.1-.66-.58-1.1-1.3-1.23-1.52-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.14-.22.22-.37.07-.15.04-.28-.02-.39-.05-.11-.5-1.21-.69-1.66-.18-.43-.36-.37-.5-.38h-.43Z"></path>
    </svg>
  `;
  document.body.appendChild(whatsappButton);
}

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();
