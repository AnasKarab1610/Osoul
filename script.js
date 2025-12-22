document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const categoryContainer = document.getElementById("category-container");
  const subCategoryContainer = document.getElementById("subcategory-container");
  const galleryGrid = document.getElementById("gallery-grid");
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const modalWrapper = document.getElementById("panzoom-container"); // The wrapper
  const closeBtn = document.querySelector(".close");

  // Data State
  let galleryData = {};
  let currentCategory = null;
  let panzoomInstance = null; // Store the zoom engine instance

  // 1. Fetch Data
  fetch("data.json")
    .then((response) => {
      if (!response.ok) throw new Error("Load failed.");
      return response.json();
    })
    .then((data) => {
      galleryData = data;
      initCategories();
    })
    .catch((err) => console.error(err));

  // 2. Initialize Main Categories
  function initCategories() {
    const categories = Object.keys(galleryData);
    categories.forEach((cat, index) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = cat;
      btn.onclick = () => selectCategory(cat, btn);
      categoryContainer.appendChild(btn);
      if (index === 0) btn.click();
    });
  }

  // 3. Select Main Category
  function selectCategory(category, btnElement) {
    currentCategory = category;
    document
      .querySelectorAll("#category-container .btn")
      .forEach((b) => b.classList.remove("active"));
    btnElement.classList.add("active");
    renderSubCategories(category);
  }

  // 4. Render Subcategories
  function renderSubCategories(category) {
    subCategoryContainer.innerHTML = "";
    subCategoryContainer.classList.remove("hidden");

    const allBtn = document.createElement("button");
    allBtn.className = "btn active";
    allBtn.textContent = "الكل";
    allBtn.onclick = () => filterImages("All", allBtn);
    subCategoryContainer.appendChild(allBtn);

    const subCats = Object.keys(galleryData[category]);
    subCats.forEach((sub) => {
      if (!sub.startsWith("_")) {
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = sub;
        btn.onclick = () => filterImages(sub, btn);
        subCategoryContainer.appendChild(btn);
      }
    });

    loadImages(category, "All");
  }

  // 5. Filter Images
  function filterImages(subCategory, btnElement) {
    document
      .querySelectorAll("#subcategory-container .btn")
      .forEach((b) => b.classList.remove("active"));
    btnElement.classList.add("active");
    loadImages(currentCategory, subCategory);
  }

  // 6. Load Images
  function loadImages(category, subCategory) {
    galleryGrid.innerHTML = "";
    let imagesToShow = [];

    if (subCategory === "All") {
      Object.values(galleryData[category]).forEach((imgs) => {
        imagesToShow = imagesToShow.concat(imgs);
      });
    } else {
      imagesToShow = galleryData[category][subCategory];
    }

    if (imagesToShow) {
      imagesToShow.forEach((imgSrc, index) => {
        const div = document.createElement("div");
        div.className = "gallery-item";
        div.style.animationDelay = `${index * 0.05}s`;

        const img = document.createElement("img");
        img.src = imgSrc;

        // 👇 التعديل هنا لسرعة الصاروخ
        img.setAttribute("loading", "lazy"); // لا يحمل الصورة إلا لما تقرب منها
        img.alt = `أصول لتنفيذ الخشب - ${currentCategory}`; // مهم جداً لجوجل (SEO)

        div.onclick = () => openModal(imgSrc);

        div.appendChild(img);
        galleryGrid.appendChild(div);
      });
    }
  }

  // --- NEW MODAL LOGIC WITH PANZOOM LIBRARY ---

  function openModal(src) {
    modal.style.display = "block"; // Use block to ensure layout calculation
    modalImg.src = src;

    // Initialize Panzoom
    // This handles the math for pinch (mobile) and drag (desktop)
    panzoomInstance = Panzoom(modalImg, {
      maxScale: 5, // Maximum zoom (5x)
      minScale: 0.5, // Minimum zoom
      contain: false, // Allow free movement
    });

    // Enable Mouse Wheel Zoom
    // The library creates a helper function for this specific task
    modalWrapper.addEventListener("wheel", panzoomInstance.zoomWithWheel);
  }

  function closeModal() {
    modal.style.display = "none";

    // Clean up: Destroy the instance to reset position and scale completely
    if (panzoomInstance) {
      // Remove the wheel listener
      modalWrapper.removeEventListener("wheel", panzoomInstance.zoomWithWheel);
      // Destroy instance
      panzoomInstance.destroy();
      panzoomInstance = null;
    }
  }

  // Close Button
  closeBtn.onclick = closeModal;

  // Close on click outside (only if clicking the dark background, not the image)
  modal.onclick = (event) => {
    if (event.target === modal || event.target === modalWrapper) {
      closeModal();
    }
  };

  // Escape Key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
});
