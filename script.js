document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const categoryContainer = document.getElementById("category-container");
  const subCategoryContainer = document.getElementById("subcategory-container");
  const galleryGrid = document.getElementById("gallery-grid");
  const modal = document.getElementById("modal");
  const closeBtn = document.querySelector(".close");

  // State
  let galleryData = {};
  let currentCategory = null;
  let currentImagesList = [];
  let swiperInstance = null;
  let touchStartY = 0;
  let touchEndY = 0;

  // 1. الترتيب اليدوي للأقسام (تم ضبط الأسماء لغوياً)
  const categoryOrder = [
    "تجاليد",
    "دواليب",
    "غرف نوم",
    "وحدات حمام",
    "مكاتب",
    "وحدات سلالم",
    "وحدات تلفاز",
    "أبواب",
    "غرف معيشة",
    "طاولات",
    "وحدات حائط",
  ];

  // 2. Fetch Data
  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      galleryData = data;
      initCategories();
    });

  // 3. Initialize Categories
  function initCategories() {
    let categories = Object.keys(galleryData);
    categories.sort((a, b) => {
      let indexA = categoryOrder.indexOf(a);
      let indexB = categoryOrder.indexOf(b);
      if (indexA === -1) indexA = 999;
      if (indexB === -1) indexB = 999;
      return indexA - indexB;
    });

    categories.forEach((cat, index) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = cat;

      btn.onclick = () => {
        selectCategory(cat, btn);
        scrollToVHResponsive(30, 50);
      };

      categoryContainer.appendChild(btn);

      // اختيار الأول تلقائياً بدون سكرول
      if (index === 0) {
        selectCategory(cat, btn);
      }
    });
  }

  // 4. Select Main Category
  function selectCategory(category, btnElement) {
    currentCategory = category;
    document
      .querySelectorAll("#category-container .btn")
      .forEach((b) => b.classList.remove("active"));
    btnElement.classList.add("active");
    renderSubCategories(category);
  }

  // 5. Render Subcategories
  function renderSubCategories(category) {
    subCategoryContainer.innerHTML = "";
    subCategoryContainer.classList.remove("hidden");

    // 1️⃣ زر "الكل" يرجع للأول (زي ما طلبت)
    const allBtn = document.createElement("button");
    allBtn.className = "btn active";
    allBtn.textContent = "الكل";
    allBtn.onclick = () => {
      filterImages("All", allBtn);
      scrollToVHResponsive(25, 40);
    };
    subCategoryContainer.appendChild(allBtn);

    // 2️⃣ باقي الأزرار الفرعية
    if (galleryData[category]) {
      let subCategories = Object.keys(galleryData[category]);
      subCategories.sort(new Intl.Collator("ar", { numeric: true }).compare);

      subCategories.forEach((sub) => {
        if (!sub.startsWith("_")) {
          const btn = document.createElement("button");
          btn.className = "btn";
          btn.textContent = sub;
          btn.onclick = () => {
            filterImages(sub, btn);
            scrollToVHResponsive(25, 40);
          };
          subCategoryContainer.appendChild(btn);
        }
      });
    }

    loadImages(category, "All");
  }

  // دالة السكرول المتجاوب
  function scrollToVHResponsive(mobileVH, desktopVH) {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const vh = window.visualViewport?.height || window.innerHeight;

    window.scrollTo({
      top: vh * ((isMobile ? mobileVH : desktopVH) / 100),
      behavior: "smooth",
    });
  }

  // 6. Filter Images
  function filterImages(subCategory, btnElement) {
    document
      .querySelectorAll("#subcategory-container .btn")
      .forEach((b) => b.classList.remove("active"));
    btnElement.classList.add("active");
    loadImages(currentCategory, subCategory);
  }

  // 7. Load Images into Grid (التعديل الجوهري هنا) 🔥
  function loadImages(category, subCategory) {
    galleryGrid.innerHTML = "";
    currentImagesList = [];

    if (subCategory === "All") {
      // ✅ المنطق الجديد لترتيب الصور داخل "الكل":
      let allKeys = Object.keys(galleryData[category]);

      // 1. نفصل المجلدات العادية عن الملفات المخفية (_)
      let namedFolders = allKeys.filter((k) => !k.startsWith("_"));
      let looseFiles = allKeys.filter((k) => k.startsWith("_")); // الصور الفلت

      // 2. نرتب المجلدات (1، 2، 3...)
      namedFolders.sort(new Intl.Collator("ar", { numeric: true }).compare);

      // 3. نضيف صور المجلدات أولاً
      namedFolders.forEach((key) => {
        currentImagesList = currentImagesList.concat(
          galleryData[category][key]
        );
      });

      // 4. نضيف الصور الفلت بالأخير
      looseFiles.forEach((key) => {
        currentImagesList = currentImagesList.concat(
          galleryData[category][key]
        );
      });
    } else {
      currentImagesList = galleryData[category][subCategory];
    }

    currentImagesList.forEach((imgSrc, index) => {
      const div = document.createElement("div");
      div.className = "gallery-item";
      const img = document.createElement("img");
      img.src = imgSrc;
      img.setAttribute("loading", "lazy");

      img.onload = function () {
        const width = this.naturalWidth;
        const height = this.naturalHeight;
        const aspectRatio = width / height;
        if (aspectRatio > 1.3) div.classList.add("wide");
        else if (aspectRatio < 0.8) div.classList.add("tall");
      };

      div.onclick = () => openSwiperModal(index);
      div.appendChild(img);
      galleryGrid.appendChild(div);
    });
  }

  // --- SWIPER MODAL CONFIGURATION ---
  function openSwiperModal(startIndex) {
    history.pushState({ modalOpen: true }, "", "#view");
    document.body.classList.add("no-scroll");
    modal.style.display = "block";

    if (swiperInstance) swiperInstance.destroy(true, true);

    const swiperWrapper = document.querySelector(".swiper-wrapper");
    swiperWrapper.innerHTML = "";

    currentImagesList.forEach((src) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      slide.innerHTML = `<div class="swiper-zoom-container"><img src="${src}"></div>`;
      swiperWrapper.appendChild(slide);
    });

    swiperInstance = new Swiper(".mySwiper", {
      initialSlide: startIndex,
      spaceBetween: 30,
      mousewheel: { forceToAxis: true },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      zoom: { maxRatio: 5, minRatio: 1, toggle: true },
      keyboard: { enabled: true },
    });
  }

  // --- Modal Close Logic ---
  function hideModalUI() {
    document.body.classList.remove("no-scroll");
    modal.style.display = "none";
  }

  window.addEventListener("popstate", () => hideModalUI());

  function requestClose() {
    if (history.state && history.state.modalOpen) history.back();
    else hideModalUI();
  }

  closeBtn.onclick = requestClose;
  modal.onclick = (e) => {
    if (e.target.classList.contains("swiper") || e.target === modal)
      requestClose();
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") requestClose();
  });

  // --- Swipe Up to Close ---
  modal.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );
  modal.addEventListener(
    "touchend",
    (e) => {
      touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture();
    },
    { passive: true }
  );

  function handleSwipeGesture() {
    const swipeDistance = touchEndY - touchStartY;
    const isZoomed = swiperInstance && swiperInstance.zoom.scale > 1;

    if (swipeDistance < -100 && !isZoomed) {
      requestClose();
    }
  }

  // --- Scroll to Top Arrow Logic  ---
  const arrow = document.getElementById("scroll-top-btn");

  if (arrow) {
    window.addEventListener("scroll", () => {
      // يظهر الزر لما ننزل 300 بكسل
      if (window.scrollY > 300) {
        arrow.classList.add("show");
      } else {
        arrow.classList.remove("show");
      }
    });

    // عند الضغط يطلع لفوق
    arrow.onclick = () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };
  }
});
