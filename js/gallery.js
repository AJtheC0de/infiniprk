const filterButtons = document.querySelectorAll(".filter-btn");
const galleryItems = [...document.querySelectorAll(".gallery-item")];
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxCaption = document.querySelector(".lightbox-caption");
let visibleItems = galleryItems;
let currentIndex = 0;

const updateLightbox = () => {
  const item = visibleItems[currentIndex];
  if (!item) return;
  lightboxImage.className = `lightbox-image wood-image ${item.dataset.variant || ""}`;
  lightboxCaption.textContent = item.dataset.title;
};

const openLightbox = (item) => {
  visibleItems = galleryItems.filter((galleryItem) => !galleryItem.hidden);
  currentIndex = visibleItems.indexOf(item);
  updateLightbox();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("menu-open");
};

const closeLightbox = () => {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    galleryItems.forEach((item) => {
      item.hidden = button.dataset.filter !== "alle" && item.dataset.category !== button.dataset.filter;
    });
  });
});

galleryItems.forEach((item) => item.addEventListener("click", () => openLightbox(item)));
document.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
document.querySelector(".lightbox-prev")?.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
  updateLightbox();
});
document.querySelector(".lightbox-next")?.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % visibleItems.length;
  updateLightbox();
});

document.addEventListener("keydown", (event) => {
  if (!lightbox?.classList.contains("is-open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") document.querySelector(".lightbox-prev")?.click();
  if (event.key === "ArrowRight") document.querySelector(".lightbox-next")?.click();
});
