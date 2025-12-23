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

  // متغيرات لحساب السحب للأسفل (ميزة جديدة)
  let touchStartY = 0;
  let touchEndY = 0;

  // 1. الترتيب اليدوي للأقسام
  const categoryOrder = [
    "تجاليد",
    "دواليب",
    "غرفة نوم",
    "علب حمامات",
    "مكتب",
    "وحدة السلم",
    "وحدة تلفاز",
    "ابواب",
    "صالة",
    "طاولة",
    "علب حائط",
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
      btn.onclick = () => selectCategory(cat, btn);
      categoryContainer.appendChild(btn);
      if (index === 0) btn.click();
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

    const allBtn = document.createElement("button");
    allBtn.className = "btn active";
    allBtn.textContent = "الكل";
    allBtn.onclick = () => filterImages("All", allBtn);
    subCategoryContainer.appendChild(allBtn);

    if (galleryData[category]) {
      let subCategories = Object.keys(galleryData[category]);

      // 👇 إضافة الترتيب الرقمي الذكي (1, 2, 10)
      subCategories.sort(new Intl.Collator("ar", { numeric: true }).compare);

      subCategories.forEach((sub) => {
        if (!sub.startsWith("_")) {
          const btn = document.createElement("button");
          btn.className = "btn";
          btn.textContent = sub;
          btn.onclick = () => filterImages(sub, btn);
          subCategoryContainer.appendChild(btn);
        }
      });
    }

    loadImages(category, "All");
  }

  // 6. Filter Images
  function filterImages(subCategory, btnElement) {
    document
      .querySelectorAll("#subcategory-container .btn")
      .forEach((b) => b.classList.remove("active"));
    btnElement.classList.add("active");
    loadImages(currentCategory, subCategory);
  }

  // 7. Load Images into Grid
  function loadImages(category, subCategory) {
    galleryGrid.innerHTML = "";
    currentImagesList = [];

    if (subCategory === "All") {
      Object.values(galleryData[category]).forEach((imgs) => {
        currentImagesList = currentImagesList.concat(imgs);
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

        if (aspectRatio > 1.3) {
          div.classList.add("wide");
        } else if (aspectRatio < 0.8) {
          div.classList.add("tall");
        }
      };

      div.onclick = () => openSwiperModal(index);
      div.appendChild(img);
      galleryGrid.appendChild(div);
    });
  }

  // --- SWIPER MODAL CONFIGURATION ---
  function openSwiperModal(startIndex) {
    // 👇 1. تسجيل نقطة في التاريخ عشان زر الرجوع يشتغل
    history.pushState({ modalOpen: true }, "", "#view");

    document.body.classList.add("no-scroll");
    modal.style.display = "block";

    if (swiperInstance) {
      swiperInstance.destroy(true, true);
    }

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
      mousewheel: {
        forceToAxis: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      zoom: {
        maxRatio: 5,
        minRatio: 1,
        toggle: true,
      },
      keyboard: {
        enabled: true,
      },
    });
  }

  // --- دالة إخفاء الواجهة فقط (بدون منطق الرجوع) ---
  function hideModalUI() {
    document.body.classList.remove("no-scroll");
    modal.style.display = "none";
  }

  // --- مستمع لزر الرجوع في الموبايل والمتصفح ---
  window.addEventListener("popstate", (event) => {
    // لما اليوزر يكبس رجوع، المتصفح بيشغل هذا الحدث
    hideModalUI();
  });

  // --- دالة طلب الإغلاق (تحاكي زر الرجوع) ---
  function requestClose() {
    // بدل ما نقفل فوراً، بنرجع خطوة لورا في الهيستوري
    // وهاد أوتوماتيكياً رح يشغل الـ popstate ويقفل المودال
    if (history.state && history.state.modalOpen) {
      history.back();
    } else {
      hideModalUI();
    }
  }

  // ربط أزرار الإغلاق بالدالة الجديدة
  closeBtn.onclick = requestClose;

  modal.onclick = (e) => {
    if (e.target.classList.contains("swiper") || e.target === modal) {
      requestClose();
    }
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") requestClose();
  });

  // --- ميزة السحب للأسفل للإغلاق (Swipe Down Logic) ---

  modal.addEventListener(
    "touchstart",
    (e) => {
      // تسجيل نقطة بداية اللمس
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );

  modal.addEventListener(
    "touchend",
    (e) => {
      // تسجيل نقطة نهاية اللمس
      touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture();
    },
    { passive: true }
  );

  function handleSwipeGesture() {
    // حساب المسافة (النهاية - البداية)
    const swipeDistance = touchEndY - touchStartY;

    // التأكد إننا مش عاملين زوم
    const isZoomed = swiperInstance && swiperInstance.zoom.scale > 1;

    // 👇 التعديل هنا:
    // بدل (swipeDistance > 100) خليناها (swipeDistance < -100)
    // يعني لو سحب لفوق مسافة 100 بكسل
    if (swipeDistance < -100 && !isZoomed) {
      requestClose();
    }
  }
});
