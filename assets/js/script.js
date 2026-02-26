const revealItems = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => observer.observe(item));

const modal = document.getElementById("gallery-modal");
const modalImage = modal.querySelector(".modal-image");
const modalTitle = modal.querySelector(".modal-title");
const modalDescription = modal.querySelector(".modal-description");
const modalClose = modal.querySelector(".modal-close");
const modalBackdrop = modal.querySelector(".modal-backdrop");
const galleryItems = document.querySelectorAll(".gallery-item, .modal-trigger");

const openModal = (item) => {
  const img = item.querySelector("img");
  const title = item.dataset.title || "Evento";
  const description =
    item.dataset.description || "Descricao do evento ou projeto.";
  const fitModal = item.dataset.size === "fit";

  modalImage.src = img.src;
  modalImage.alt = img.alt || title;
  modalTitle.textContent = title;
  modalDescription.textContent = description;
  modal.classList.toggle("fit", fitModal);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

galleryItems.forEach((item) => {
  item.addEventListener("click", () => openModal(item));
});

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

const languageButtons = document.querySelectorAll(".lang-toggle");

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    languageButtons.forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-pressed", "false");
    });

    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");
  });
});
