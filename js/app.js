(function () {
  const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
  const isConsultPrice = (product) => product?.priceStatus === "consult" || Number(product?.price) <= 0;
  const productPriceLabel = (product) => isConsultPrice(product) ? "Consultar precio" : money(product.price);
  const compareProductPrices = (left, right, direction = 1) => {
    const leftConsult = isConsultPrice(left);
    const rightConsult = isConsultPrice(right);
    if (leftConsult !== rightConsult) return leftConsult ? 1 : -1;
    return direction * (Number(left.price) - Number(right.price));
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const categoryDisplayName = (value) => {
    if (value === "Todos") return "Todos los productos";
    const lowercaseWords = new Set(["y", "e", "o", "de", "del", "para"]);
    return String(value).toLocaleLowerCase("es-AR").split(" ").map((word, index) => lowercaseWords.has(word) && index ? word : `${word.charAt(0).toLocaleUpperCase("es-AR")}${word.slice(1)}`).join(" ");
  };
  const productImageSrc = (product) => {
    const image = String(product?.image || "").trim();
    if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(image)) return image;
    if (/^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp|gif|avif)$/i.test(image)) return image;
    if (/^[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp|gif|avif)$/i.test(image)) return `assets/${image}`;
    return window.KAIZEN_CATEGORY_IMAGE(product?.category);
  };
  const CONTACT = Object.freeze({
    phoneDisplay: "3644-594151",
    whatsapp: "5493644594151",
    email: "kaizen.diet2020@gmail.com",
    instagram: "https://www.instagram.com/kaizen.diet/",
    facebook: "https://www.facebook.com/search/top?q=Kaizen%20Diet%C3%A9tica",
    maps: "https://www.google.com/maps/search/?api=1&query=Salta%20485%2C%20Juan%20Jos%C3%A9%20Castelli%2C%20Chaco%2C%203705%2C%20Argentina"
  });
  const whatsappUrl = (message = "") => `https://wa.me/${CONTACT.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  const currentPage = () => document.body.dataset.page || "home";
  const localDate = (iso) => new Date(`${iso}T12:00:00`);
  const formatAddress = (address) => {
    if (!address || typeof address !== "object") return String(address || "");
    const main = [address.street, address.number].filter(Boolean).join(" ");
    return [main, address.floorApartment, address.locality, address.postalCode ? `CP ${address.postalCode}` : "", address.reference].filter(Boolean).join(" · ");
  };

  function headerMarkup() {
    const page = currentPage();
    const session = window.KaizenStore.getSession();
    const isAdmin = session?.role === "admin";
    const active = (name) => page === name ? "active" : "";
    return `
      <div class="announcement"><div class="announcement-inner">
        <span class="announcement-item"><span class="announcement-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9h12l1 11H5L6 9Z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/></svg></span><strong>Compra online</strong></span>
        <a class="announcement-item announcement-whatsapp" href="${whatsappUrl("Hola Kaizen, quisiera hacer una consulta.")}" target="_blank" rel="noopener noreferrer"><span class="announcement-icon"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93a7.898 7.898 0 0 0-2.327-5.607zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.63-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.231.148-.429.05-.197-.1-.836-.308-1.592-.984-.59-.525-.986-1.175-1.1-1.372-.116-.198-.013-.306.085-.404.087-.087.198-.231.297-.346.1-.116.133-.198.198-.33.065-.134.034-.25-.016-.35-.05-.099-.445-1.074-.61-1.47-.16-.388-.323-.334-.445-.34-.114-.006-.247-.007-.378-.007a.729.729 0 0 0-.528.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.132 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.151.906.129 1.247.078.38-.057 1.17-.48 1.336-.943.164-.462.164-.858.114-.943-.049-.084-.182-.132-.38-.23z"/></svg></span><span>WhatsApp <strong>${CONTACT.phoneDisplay}</strong></span></a>
        <span class="announcement-item"><span class="announcement-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v11H4z"/><path d="M8 8V5h8v3M4 12h16"/></svg></span>Retiro en el local</span>
        <span class="announcement-item"><span class="announcement-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg></span>Envíos a domicilio</span>
      </div></div>
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="index.html" aria-label="Kaizen, ir al inicio"><img src="assets/logo-horizontal-v2.png" alt="Kaizen Dietética & Nutrición"></a>
          <nav class="main-nav" id="main-nav" aria-label="Navegación principal">
            <a class="${active("home")}" href="index.html">Inicio</a>
            <a class="${active("shop")}" href="tienda.html">Tienda</a>
            <a class="${active("nutrition")}" href="nutricion.html">Nutrición y turnos</a>
            <a class="${active("account")}" href="cuenta.html">${isAdmin ? "Administración" : "Mi cuenta"}</a>
          </nav>
          <div class="header-actions">
            <a class="button ghost small" href="${session ? "cuenta.html" : "acceso.html"}"><span class="account-label">${session ? escapeHtml(session.name.split(" ")[0]) : "Ingresar"}</span><span aria-hidden="true">◎</span></a>
            ${isAdmin ? "" : `<a class="button small cart-button ${active("cart")}" href="carrito.html">Carrito <span class="cart-count" data-cart-count>0</span></a>`}
          </div>
        </div>
      </header>`;
  }

  function footerMarkup() {
    return `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div><img src="assets/logo-horizontal-v2.png" alt="Kaizen Dietética & Nutrición"><p>Dietética de cercanía y consultorio nutricional. Productos elegidos y acompañamiento profesional, paso a paso.</p></div>
          <div class="footer-links"><strong>Explorá</strong><a href="tienda.html">Catálogo</a><a href="nutricion.html">Reservar turno</a><a href="cuenta.html">Mi cuenta</a></div>
          <div class="footer-links"><strong>Contacto</strong><a href="${whatsappUrl("Hola Kaizen, quisiera hacer una consulta.")}" target="_blank" rel="noopener noreferrer">WhatsApp · ${CONTACT.phoneDisplay}</a><a href="mailto:${CONTACT.email}">${CONTACT.email}</a><a href="${CONTACT.maps}" target="_blank" rel="noopener noreferrer">Salta 485 · Juan José Castelli</a><span>Chaco · CP 3705</span></div>
          <div class="footer-links"><strong>Redes</strong><a href="${CONTACT.instagram}" target="_blank" rel="noopener noreferrer">Instagram · @kaizen.diet</a><a href="${CONTACT.facebook}" target="_blank" rel="noopener noreferrer">Facebook · Kaizen Dietética</a></div>
        </div>
        <div class="container footer-bottom"><span>© ${new Date().getFullYear()} Kaizen Dietética & Nutrición</span><span>Salta 485 · Juan José Castelli, Chaco</span></div>
      </footer>`;
  }

  function toast(message) {
    document.querySelector(".toast")?.remove();
    const element = document.createElement("div");
    element.className = "toast";
    element.setAttribute("role", "status");
    element.textContent = message;
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 2600);
  }

  function updateCartBadge() {
    const quantity = window.KaizenStore.getCartSummary().quantity;
    document.querySelectorAll("[data-cart-count]").forEach((element) => { element.textContent = quantity; });
  }

  function productActions(product) {
    const session = window.KaizenStore.getSession();
    if (session?.role === "admin") return `<button class="button ghost small" disabled>Solo clientes</button>`;
    if (product.stock === 0) return `<button class="button ghost small" disabled>Sin stock</button>`;
    if (isConsultPrice(product)) return `<button class="button ghost small" data-consult-product="${product.id}">Consultar</button>`;
    const line = window.KaizenStore.getCartSummary().lines.find((item) => item.product.id === product.id);
    if (!line) return `<button class="button small" data-add-product="${product.id}">Agregar</button>`;
    return `<div class="product-qty" aria-label="Cantidad de ${escapeHtml(product.name)}"><button data-qty="${product.id}" data-value="${line.quantity - 1}" aria-label="Quitar uno">−</button><strong>${line.quantity}</strong><button data-qty="${product.id}" data-value="${line.quantity + 1}" aria-label="Agregar uno">+</button></div>`;
  }

  function productCard(product) {
    return `
      <article class="product-card" data-product-card="${product.id}">
        <div class="product-image"><img src="${escapeHtml(productImageSrc(product))}" alt="${escapeHtml(product.name)}"><span class="tag">${escapeHtml(product.unit)}</span></div>
        <div class="product-body"><span class="product-meta">${escapeHtml(product.category)} · ${escapeHtml(product.article)}${product.isPromotion ? " · Promoción" : ""}</span><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description)}</p><div class="product-bottom"><span class="price">${productPriceLabel(product)}</span><div data-product-actions="${product.id}">${productActions(product)}</div></div></div>
      </article>`;
  }

  const productBaseArticle = (product) => String(product.article || "").replace(/-V\d+$/i, "");
  function groupCatalogProducts(products) {
    const groups = new Map();
    products.forEach((product) => {
      const key = `${product.category}::${productBaseArticle(product)}`;
      if (!groups.has(key)) groups.set(key, { key, article: productBaseArticle(product), name: product.name, category: product.category, variants: [] });
      groups.get(key).variants.push(product);
    });
    return [...groups.values()].map((group) => ({ ...group, variants: group.variants.sort((a, b) => Number(a.price) - Number(b.price) || a.article.localeCompare(b.article)) }));
  }
  const groupMinimumPrice = (group) => {
    const prices = group.variants.filter((product) => !isConsultPrice(product)).map((product) => Number(product.price));
    return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
  };
  const variantOptionLabel = (product) => `${product.unit}${product.isPromotion ? ` · Promo desde ${product.promotionMinimumQuantity} u.` : ""} · ${productPriceLabel(product)}${product.stock === 0 ? " · Sin stock" : ""}`;
  const selectedVariant = (group) => group.variants.find((product) => !product.isPromotion && product.stock !== 0 && !isConsultPrice(product)) || group.variants.find((product) => product.stock !== 0) || group.variants[0];
  function variantDetailMarkup(product) {
    const stock = product.stock === null || product.stock === undefined ? "Disponibilidad a confirmar" : product.stock === 0 ? "Sin stock" : `${product.stock} disponibles`;
    return `<div class="variant-detail"><p>${escapeHtml(product.condition || product.description)}</p><div class="product-bottom"><div><span class="price">${productPriceLabel(product)}</span><small class="stock-label ${product.stock === 0 ? "empty" : ""}">${escapeHtml(stock)}</small></div><div data-product-actions="${product.id}">${productActions(product)}</div></div></div>`;
  }
  function productGroupCard(group) {
    const selected = selectedVariant(group);
    return `<article class="product-card grouped-product-card" data-product-group="${escapeHtml(group.key)}">
      <div class="product-image"><img data-group-image src="${escapeHtml(productImageSrc(selected))}" alt="${escapeHtml(group.name)}"><span class="tag">${group.variants.length} ${group.variants.length === 1 ? "opción" : "opciones"}</span></div>
      <div class="product-body"><span class="product-meta">${escapeHtml(group.category)} · ${escapeHtml(group.article)}</span><h3>${escapeHtml(group.name)}</h3><p class="group-helper">Elegí una presentación para ver su condición, precio y disponibilidad.</p><label class="variant-picker">Presentación<select data-product-variant>${group.variants.map((product) => `<option value="${product.id}" ${product.id === selected.id ? "selected" : ""}>${escapeHtml(variantOptionLabel(product))}</option>`).join("")}</select></label><div data-variant-detail>${variantDetailMarkup(selected)}</div></div>
    </article>`;
  }

  function refreshProductActions() {
    document.querySelectorAll("[data-product-actions]").forEach((element) => {
      const product = window.KAIZEN_PRODUCTS.find((item) => item.id === Number(element.dataset.productActions));
      if (product) element.innerHTML = productActions(product);
    });
    updateCartBadge();
  }

  function bindGlobalEvents() {
    document.addEventListener("click", (event) => {
      const consultButton = event.target.closest("[data-consult-product]");
      if (consultButton) {
        const product = window.KAIZEN_PRODUCTS.find((item) => item.id === Number(consultButton.dataset.consultProduct));
        if (product) {
          window.open(whatsappUrl(`Hola Kaizen, quisiera consultar el precio de ${product.name} (${product.article}, ${product.unit}).`), "_blank", "noopener,noreferrer");
        }
      }
      const addButton = event.target.closest("[data-add-product]");
      if (addButton) {
        const product = window.KAIZEN_PRODUCTS.find((item) => item.id === Number(addButton.dataset.addProduct));
        try {
          window.KaizenStore.addToCart(product.id);
          refreshProductActions();
          toast(`${product.name} se agregó al carrito.`);
        } catch (error) { toast(error.message); }
      }
      const qty = event.target.closest("[data-qty]");
      if (qty) {
        try {
          window.KaizenStore.updateCart(Number(qty.dataset.qty), Number(qty.dataset.value));
          refreshProductActions();
          renderCartPage();
        } catch (error) { toast(error.message); }
      }
    });
    document.addEventListener("change", (event) => {
      const picker = event.target.closest("[data-product-variant]");
      if (!picker) return;
      const card = picker.closest("[data-product-group]");
      const product = window.KaizenStore.getCatalogProducts().find((item) => item.id === Number(picker.value));
      if (card && product) {
        card.querySelector("[data-variant-detail]").innerHTML = variantDetailMarkup(product);
        const image = card.querySelector("[data-group-image]");
        if (image) image.src = productImageSrc(product);
      }
    });
    window.addEventListener("kaizen:cart", updateCartBadge);
  }

  function initHome() {
    const featured = document.getElementById("featured-products");
    if (featured) {
      const chosen = window.KAIZEN_CATEGORIES.map((category) => window.KAIZEN_PRODUCTS.find((product) => product.category === category.name && !product.isPromotion && !isConsultPrice(product))).filter(Boolean).slice(0, 8);
      featured.innerHTML = chosen.map(productCard).join("");
      document.querySelectorAll("[data-carousel-direction]").forEach((button) => button.addEventListener("click", () => {
        featured.scrollBy({ left: featured.clientWidth * (button.dataset.carouselDirection === "next" ? .82 : -.82), behavior: "smooth" });
      }));
    }
    const categories = document.getElementById("home-categories");
    if (categories) categories.innerHTML = window.KAIZEN_CATEGORIES.slice(0, 3).map((category) => `<a class="category-card" href="tienda.html?categoria=${encodeURIComponent(category.name)}"><img src="assets/${category.image}" alt=""><span>${escapeHtml(category.name)} →</span></a>`).join("");
  }

  function initShop() {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;
    const search = document.getElementById("catalog-search");
    const sort = document.getElementById("catalog-sort");
    const quantity = document.getElementById("catalog-quantity");
    const chips = document.getElementById("category-chips");
    const status = document.getElementById("catalog-count");
    const pagination = document.getElementById("catalog-pagination");
    let category = new URLSearchParams(location.search).get("categoria") || "Todos";
    let page = 1;
    function render() {
      const query = search.value.trim().toLowerCase();
      let groups = groupCatalogProducts(window.KaizenStore.getCatalogProducts()).filter((group) => {
        const searchable = `${group.name} ${group.article} ${group.category} ${group.variants.map((product) => `${product.article} ${product.unit} ${product.description} ${product.condition}`).join(" ")}`.toLowerCase();
        return (category === "Todos" || group.category === category) && (!query || searchable.includes(query));
      });
      if (sort.value === "asc") groups.sort((a, b) => groupMinimumPrice(a) - groupMinimumPrice(b));
      if (sort.value === "desc") groups.sort((a, b) => groupMinimumPrice(b) - groupMinimumPrice(a));
      const pageSize = Number(quantity.value) || 24;
      const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
      page = Math.min(page, totalPages);
      const visibleGroups = groups.slice((page - 1) * pageSize, page * pageSize);
      const variantCount = groups.reduce((sum, group) => sum + group.variants.length, 0);
      grid.innerHTML = visibleGroups.length ? visibleGroups.map(productGroupCard).join("") : `<div class="empty-state"><h3>No encontramos coincidencias</h3><p class="muted">Probá con otro nombre, artículo o categoría.</p></div>`;
      status.textContent = groups.length ? `${groups.length} ${groups.length === 1 ? "producto" : "productos"} · ${variantCount} presentaciones · página ${page} de ${totalPages}` : "0 productos";
      pagination.innerHTML = groups.length > pageSize ? `<button class="button ghost small" type="button" data-catalog-page="${page - 1}" ${page === 1 ? "disabled" : ""}>‹ Anterior</button><span>Página <strong>${page}</strong> de ${totalPages}</span><button class="button ghost small" type="button" data-catalog-page="${page + 1}" ${page === totalPages ? "disabled" : ""}>Siguiente ›</button>` : "";
      chips.innerHTML = ["Todos", ...window.KAIZEN_CATEGORIES.map((item) => item.name)].map((name) => `<button class="chip ${name === category ? "active" : ""}" data-category="${escapeHtml(name)}"><span>${escapeHtml(categoryDisplayName(name))}</span></button>`).join("");
    }
    search.addEventListener("input", () => { page = 1; render(); });
    sort.addEventListener("change", () => { page = 1; render(); });
    quantity.addEventListener("change", () => { page = 1; render(); });
    chips.addEventListener("click", (event) => { const button = event.target.closest("[data-category]"); if (button) { category = button.dataset.category; page = 1; render(); } });
    pagination.addEventListener("click", (event) => { const button = event.target.closest("[data-catalog-page]"); if (button && !button.disabled) { page = Number(button.dataset.catalogPage); render(); grid.scrollIntoView({ behavior: "smooth", block: "start" }); } });
    render();
  }

  const appointmentDurationMinutes = (type) => String(type || "").toLocaleLowerCase("es-AR").includes("control") && type !== "Consulta inicial + 2 Controles" ? 20 : 40;
  const isAppointmentPromo = (type) => type === "Consulta inicial + 2 Controles";
  const scheduleKeyForModality = (modality) => modality === "Virtual" ? "virtual" : "presential";
  const addDaysIso = (date, days) => {
    const next = localDate(date);
    next.setDate(next.getDate() + days);
    return next.toISOString().slice(0, 10);
  };
  const promoDates = (date) => [date, addDaysIso(date, 7), addDaysIso(date, 14)];

  function upcomingDates(modality) {
    const schedule = window.KaizenStore.getSchedule();
    const channel = schedule[scheduleKeyForModality(modality)];
    const dates = [];
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    for (let day = 1; day <= 28 && dates.length < 8; day++) {
      const date = new Date(cursor);
      date.setDate(cursor.getDate() + day);
      if (channel.weekdays.includes(date.getDay())) dates.push(date);
    }
    return dates;
  }

  function initNutrition() {
    const form = document.getElementById("booking-form");
    if (!form) return;
    const session = window.KaizenStore.getSession();
    const schedule = window.KaizenStore.getSchedule();
    document.getElementById("booking-mode").textContent = schedule.mode === "auto" ? "Confirmación inmediata" : "Sujeto a aprobación";
    if (session?.role === "admin") {
      form.innerHTML = `<div class="empty-state"><span class="tag">Cuenta administrativa</span><h2>La nutricionista no puede reservar turnos</h2><p class="muted">Desde el panel podés revisar las consultas a atender y administrar la disponibilidad.</p><a class="button" href="cuenta.html">Ir a administración</a></div>`;
      return;
    }
    const selection = { type: "", modality: "", date: "", time: "" };
    const dateRow = document.getElementById("date-row");
    const slotRow = document.getElementById("slot-row");
    const summary = document.getElementById("booking-summary");
    const result = document.getElementById("booking-result");
    const promoChoice = form.querySelector('[data-booking-choice="Consulta inicial + 2 Controles"]');
    if (promoChoice && session?.role === "customer" && window.KaizenStore.hasUsedPromo()) {
      promoChoice.disabled = true;
      promoChoice.classList.add("used");
      promoChoice.querySelector("small").textContent = "Promoción ya utilizada por esta cuenta";
    }
    dateRow.innerHTML = `<p class="muted slot-help">Elegí una modalidad para ver las próximas fechas disponibles.</p>`;
    slotRow.innerHTML = `<p class="muted slot-help">Elegí el tipo de consulta, la modalidad y una fecha para ver los horarios.</p>`;
    const renderDates = () => {
      const dates = upcomingDates(selection.modality);
      dateRow.innerHTML = dates.length ? dates.map((date) => {
        const iso = date.toISOString().slice(0, 10);
        return `<button type="button" class="date-button" data-date="${iso}"><span>${date.toLocaleDateString("es-AR", { weekday: "short" })}</span><b>${date.getDate()}</b><small>${date.toLocaleDateString("es-AR", { month: "short" })}</small></button>`;
      }).join("") : `<p class="muted slot-help">No hay días habilitados para esta modalidad.</p>`;
      slotRow.innerHTML = `<p class="muted slot-help">Elegí una fecha para ver los horarios disponibles y ocupados.</p>`;
    };
    const renderSlots = (date) => {
      if (!selection.type || !selection.modality) { slotRow.innerHTML = `<p class="muted slot-help">Completá primero el tipo de consulta y la modalidad.</p>`; return; }
      const duration = appointmentDurationMinutes(selection.type);
      const occupied = new Set(window.KaizenStore.getOccupiedSlots(date, selection.modality, selection.type));
      const times = schedule[scheduleKeyForModality(selection.modality)].times;
      slotRow.innerHTML = times.map((time) => occupied.has(time)
        ? `<button type="button" class="slot-button occupied" disabled aria-label="${time}, ocupado"><strong>${time}</strong><span>Ocupado</span></button>`
        : `<button type="button" class="slot-button" data-time="${time}"><strong>${time}</strong><span>${isAppointmentPromo(selection.type) ? "3 turnos" : `${duration} min`}</span></button>`).join("");
    };
    const updateSummary = () => {
      const duration = selection.type ? `${appointmentDurationMinutes(selection.type)} min` : "Duración pendiente";
      if (isAppointmentPromo(selection.type) && selection.date) {
        const dates = promoDates(selection.date);
        summary.innerHTML = `<strong>Promoción de 3 turnos</strong><span>${escapeHtml(selection.modality || "Modalidad pendiente")} · ${escapeHtml(selection.time || "Horario pendiente")}</span><ul class="booking-bundle-list"><li>Consulta inicial · ${localDate(dates[0]).toLocaleDateString("es-AR")} · 40 min</li><li>Control 1 · ${localDate(dates[1]).toLocaleDateString("es-AR")} · 20 min</li><li>Control 2 · ${localDate(dates[2]).toLocaleDateString("es-AR")} · 20 min</li></ul>`;
        return;
      }
      summary.textContent = selection.type || selection.modality || selection.date || selection.time ? `${selection.type || "Tipo pendiente"} · ${duration} · ${selection.modality || "Modalidad pendiente"} · ${selection.date ? localDate(selection.date).toLocaleDateString("es-AR") : "Fecha pendiente"} · ${selection.time || "Horario pendiente"}` : "Tu selección aparecerá acá.";
    };
    form.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-booking-choice]");
      if (choice && !choice.disabled) { form.querySelectorAll("[data-booking-choice]").forEach((item) => item.classList.remove("selected")); choice.classList.add("selected"); selection.type = choice.dataset.bookingChoice; selection.time = ""; if (selection.date) renderSlots(selection.date); }
      const modality = event.target.closest("[data-booking-modality]");
      if (modality) { form.querySelectorAll("[data-booking-modality]").forEach((item) => item.classList.remove("selected")); modality.classList.add("selected"); selection.modality = modality.dataset.bookingModality; selection.date = ""; selection.time = ""; renderDates(); }
      const date = event.target.closest("[data-date]");
      if (date) { form.querySelectorAll("[data-date]").forEach((item) => item.classList.remove("selected")); date.classList.add("selected"); selection.date = date.dataset.date; selection.time = ""; renderSlots(selection.date); }
      const time = event.target.closest("[data-time]");
      if (time) { form.querySelectorAll("[data-time]").forEach((item) => item.classList.remove("selected")); time.classList.add("selected"); selection.time = time.dataset.time; }
      updateSummary();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!window.KaizenStore.getSession()) { window.location.href = "acceso.html?return=nutricion.html"; return; }
      const policyAccept = document.getElementById("appointment-policy-accept");
      if (policyAccept && !policyAccept.checked) { result.textContent = "Confirmá que leíste las condiciones de reprogramación y cancelación."; result.className = "form-message error"; policyAccept.focus(); return; }
      try {
        const appointment = window.KaizenStore.createAppointment({ ...selection, notes: document.getElementById("appointment-notes").value });
        const bundle = appointment.bundleAppointments || [appointment];
        const detail = bundle.length > 1
          ? `<p>Quedaron reservados la consulta inicial y los dos controles semanales, siempre a las ${escapeHtml(appointment.time)}.</p><ul class="booking-bundle-list confirmed-list">${bundle.map((item) => `<li><strong>${escapeHtml(item.type)}</strong><span>${localDate(item.date).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} · ${item.durationMinutes} min · ${escapeHtml(item.modality)}</span></li>`).join("")}</ul>`
          : `<p>${escapeHtml(appointment.modality)} · ${appointment.durationMinutes} min · ${localDate(appointment.date).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} a las ${escapeHtml(appointment.time)}</p>`;
        form.innerHTML = `<div class="empty-state"><span class="status ${appointment.status === "Confirmado" ? "confirmed" : "pending"}">${appointment.status}</span><h2>${bundle.length > 1 ? "Tus 3 turnos quedaron reservados" : `Tu turno quedó ${appointment.status.toLowerCase()}`}</h2>${detail}<a class="button" href="cuenta.html">Ver mis turnos</a></div>`;
      } catch (error) { result.textContent = error.message; result.className = "form-message error"; }
    });
  }

  function initAuth() {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;
    const params = new URLSearchParams(location.search);
    const returnTo = params.get("return") || "cuenta.html";
    if (window.KaizenStore.getSession()) { location.href = returnTo; return; }
    document.querySelectorAll("[data-auth-tab]").forEach((tab) => tab.addEventListener("click", () => {
      document.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.toggle("active", item === tab));
      document.getElementById("login-panel").hidden = tab.dataset.authTab !== "login";
      document.getElementById("register-panel").hidden = tab.dataset.authTab !== "register";
    }));
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = document.getElementById("login-message");
      try { await window.KaizenStore.login(document.getElementById("login-email").value, document.getElementById("login-password").value); location.href = returnTo; }
      catch (error) { message.textContent = error.message; message.className = "form-message error"; }
    });
    document.getElementById("register-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = document.getElementById("register-message");
      const password = document.getElementById("register-password").value;
      if (password !== document.getElementById("register-confirm").value) { message.textContent = "Las contraseñas no coinciden."; message.className = "form-message error"; return; }
      try {
        await window.KaizenStore.register({
          name: document.getElementById("register-name").value,
          email: document.getElementById("register-email").value,
          birthDate: document.getElementById("register-birth-date").value,
          phone: document.getElementById("register-phone").value,
          locality: document.getElementById("register-locality").value,
          password
        });
        location.href = returnTo;
      } catch (error) { message.textContent = error.message; message.className = "form-message error"; }
    });
  }

  function renderCartPage() {
    const linesElement = document.getElementById("cart-page-lines");
    if (!linesElement) return;
    const session = window.KaizenStore.getSession();
    if (session?.role === "admin") {
      document.getElementById("cart-page-root").innerHTML = `<div class="empty-state"><span class="tag">Cuenta administrativa</span><h2>La administración no puede realizar pedidos</h2><p class="muted">Usá el panel para revisar los pedidos de los clientes.</p><a class="button" href="cuenta.html">Ir a administración</a></div>`;
      return;
    }
    const summary = window.KaizenStore.getCartSummary();
    linesElement.innerHTML = summary.lines.length ? summary.lines.map(({ product, quantity }) => `
      <article class="cart-page-line"><img src="${escapeHtml(productImageSrc(product))}" alt=""><div><span class="product-meta">${escapeHtml(product.article)}</span><h3>${escapeHtml(product.name)}</h3><p class="muted">${escapeHtml(product.unit)} · ${money(product.price)} c/u</p></div><div class="line-price">${money(product.price * quantity)}</div><div class="product-qty"><button data-qty="${product.id}" data-value="${quantity - 1}" aria-label="Quitar uno">−</button><strong>${quantity}</strong><button data-qty="${product.id}" data-value="${quantity + 1}" aria-label="Agregar uno">+</button></div></article>`).join("") : `<div class="empty-state"><h2>Tu carrito está vacío</h2><p class="muted">Explorá el catálogo y agregá tus productos favoritos.</p><a class="button" href="tienda.html">Ir a la tienda</a></div>`;
    document.getElementById("cart-page-total").textContent = money(summary.total);
    document.getElementById("checkout-panel").hidden = !summary.lines.length;
  }

  function initCart() {
    const form = document.getElementById("checkout-form");
    if (!form) return;
    renderCartPage();
    const selection = { payment: "", delivery: "" };
    const savedAddress = window.KaizenStore.getDeliveryAddress();
    Object.entries({
      "checkout-street": savedAddress.street,
      "checkout-number": savedAddress.number,
      "checkout-floor": savedAddress.floorApartment,
      "checkout-locality": savedAddress.locality,
      "checkout-postal-code": savedAddress.postalCode,
      "checkout-reference": savedAddress.reference
    }).forEach(([id, value]) => { const field = document.getElementById(id); if (field) field.value = value || ""; });
    form.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-checkout-choice]");
      if (!choice) return;
      const group = choice.dataset.group;
      form.querySelectorAll(`[data-group="${group}"]`).forEach((item) => item.classList.remove("selected"));
      choice.classList.add("selected");
      selection[group] = choice.dataset.checkoutChoice;
      if (group === "delivery") document.getElementById("address-field").hidden = selection.delivery !== "delivery";
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = document.getElementById("checkout-message");
      if (!window.KaizenStore.getSession()) { location.href = "acceso.html?return=carrito.html"; return; }
      try {
        const address = {
          street: document.getElementById("checkout-street").value,
          number: document.getElementById("checkout-number").value,
          floorApartment: document.getElementById("checkout-floor").value,
          locality: document.getElementById("checkout-locality").value,
          postalCode: document.getElementById("checkout-postal-code").value,
          reference: document.getElementById("checkout-reference").value
        };
        const order = window.KaizenStore.placeOrder({ payment: selection.payment, delivery: selection.delivery, address, notes: document.getElementById("checkout-notes").value });
        if (order.paymentKey === "whatsapp") {
          window.open(whatsappUrl(`Hola Kaizen, quiero coordinar el pedido ${order.id} por ${money(order.total)} (${order.delivery}).`), "_blank", "noopener,noreferrer");
        }
        document.getElementById("cart-page-root").innerHTML = `<div class="empty-state order-success"><span class="status ${order.status === "Confirmado" ? "confirmed" : "pending"}">${escapeHtml(order.status)}</span><h2>Pedido ${escapeHtml(order.id)} registrado</h2><p>${escapeHtml(order.payment)} · ${escapeHtml(order.delivery)}</p><p class="price">${money(order.total)}</p><a class="button" href="cuenta.html">Ver mis pedidos</a></div>`;
        updateCartBadge();
      } catch (error) { message.textContent = error.message; message.className = "form-message error"; }
    });
  }

  function orderCard(order, admin = false) {
    return `<article class="record-card"><div class="record-head"><div><strong>${escapeHtml(order.id)}</strong><br><small class="muted">${new Date(order.createdAt).toLocaleString("es-AR")}${admin ? ` · ${escapeHtml(order.userName || order.userEmail)}` : ""}</small></div><span class="status ${order.status === "Confirmado" ? "confirmed" : "pending"}">${escapeHtml(order.status)}</span></div><p>${escapeHtml(order.payment)} · ${escapeHtml(order.delivery)}</p>${order.deliveryKey === "delivery" && order.address ? `<p class="fine-print"><strong>Entrega:</strong> ${escapeHtml(formatAddress(order.address))}</p>` : ""}${admin ? `<p class="fine-print">${escapeHtml(order.userPhone || "Sin teléfono")} · ${escapeHtml(order.userLocality || "Sin localidad")}</p>` : ""}<div class="cluster"><strong>${money(order.total)}</strong><span class="muted">${order.items.reduce((sum, item) => sum + item.quantity, 0)} unidades</span></div></article>`;
  }

  function appointmentCard(appointment, admin = false) {
    const modality = appointment.modality || "Presencial";
    const duration = Number(appointment.durationMinutes) || appointmentDurationMinutes(appointment.type);
    const phoneDigits = String(appointment.userPhone || "").replace(/\D/g, "");
    const whatsappPhone = phoneDigits.startsWith("54") ? phoneDigits : phoneDigits.length >= 10 ? `549${phoneDigits.replace(/^0/, "")}` : "";
    const contactActions = admin ? `<div class="cluster appointment-contact-actions">${whatsappPhone ? `<a class="button small whatsapp-button" href="https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hola ${appointment.userName || ""}, te contactamos desde Kaizen por tu turno del ${appointment.date} a las ${appointment.time}.`)}" target="_blank" rel="noopener noreferrer">Contactar por WhatsApp</a>` : ""}${appointment.userEmail ? `<a class="button ghost small" href="mailto:${encodeURIComponent(appointment.userEmail)}?subject=${encodeURIComponent("Tu turno en Kaizen")}">Enviar correo</a>` : ""}</div>` : "";
    return `<article class="record-card"><div class="record-head"><div><strong>${escapeHtml(appointment.type)}</strong><br><small class="muted">${escapeHtml(appointment.id)}${admin ? ` · ${escapeHtml(appointment.userName)}` : ""}</small></div><span class="status ${appointment.status === "Confirmado" ? "confirmed" : "pending"}">${escapeHtml(appointment.status)}</span></div><p>${localDate(appointment.date).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} · ${escapeHtml(appointment.time)} · ${escapeHtml(modality)} · ${duration} min</p>${admin ? `<p class="fine-print">${escapeHtml(appointment.userPhone || "Sin teléfono")} · ${escapeHtml(appointment.userEmail || "Sin email")}${appointment.notes ? ` · ${escapeHtml(appointment.notes)}` : ""}</p>` : ""}${admin && appointment.status === "Pendiente" ? `<div class="cluster"><button class="button small" data-appointment-status="Confirmado" data-appointment-id="${appointment.id}">Confirmar</button><button class="button ghost small" data-appointment-status="Cancelado" data-appointment-id="${appointment.id}">Rechazar</button></div>` : ""}${contactActions}</article>`;
  }

  function renderAppointmentCalendar(appointments) {
    const target = document.getElementById("appointment-calendar");
    if (!target) return;
    const active = appointments.filter((item) => item.status !== "Cancelado").sort((a, b) => a.date.localeCompare(b.date));
    const focus = active[0] ? localDate(active[0].date) : new Date();
    const year = focus.getFullYear();
    const month = focus.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7;
    const appointmentDays = new Set(active.filter((item) => localDate(item.date).getFullYear() === year && localDate(item.date).getMonth() === month).map((item) => localDate(item.date).getDate()));
    const blanks = Array.from({ length: offset }, () => `<span class="calendar-day blank"></span>`).join("");
    const days = Array.from({ length: lastDay }, (_, index) => {
      const day = index + 1;
      return `<span class="calendar-day ${appointmentDays.has(day) ? "has-appointment" : ""}">${day}${appointmentDays.has(day) ? `<i aria-label="Turno reservado"></i>` : ""}</span>`;
    }).join("");
    target.innerHTML = `<div class="calendar-head"><div><p class="eyebrow">Calendario</p><h3>${focus.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</h3></div><span class="calendar-legend"><i></i> Día con turno</span></div><div class="calendar-weekdays"><b>Lun</b><b>Mar</b><b>Mié</b><b>Jue</b><b>Vie</b><b>Sáb</b><b>Dom</b></div><div class="calendar-grid">${blanks}${days}</div>`;
  }

  function groupOrdersByMonthAndDay(orders) {
    if (!orders.length) return `<div class="empty-state"><p>No hay pedidos registrados.</p></div>`;
    const groups = new Map();
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const dayKey = date.toISOString().slice(0, 10);
      if (!groups.has(monthKey)) groups.set(monthKey, { date, days: new Map() });
      const month = groups.get(monthKey);
      if (!month.days.has(dayKey)) month.days.set(dayKey, { date, orders: [] });
      month.days.get(dayKey).orders.push(order);
    });
    return [...groups.values()].map((month) => `<section class="order-month"><h3>${month.date.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</h3>${[...month.days.values()].map((day) => `<div class="order-day"><h4>${day.date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</h4><div class="record-list">${day.orders.map((order) => orderCard(order, true)).join("")}</div></div>`).join("")}</section>`).join("");
  }

  function bindAccountTabs() {
    document.querySelectorAll("[data-panel-target]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-panel-target]").forEach((item) => item.classList.toggle("active", item === button));
      document.querySelectorAll(".dashboard-panel").forEach((panel) => panel.classList.toggle("active", panel.id === button.dataset.panelTarget));
    }));
  }

  function initAccount() {
    const root = document.getElementById("account-root");
    if (!root) return;
    const user = window.KaizenStore.getSession();
    if (!user) { location.href = "acceso.html?return=cuenta.html"; return; }
    const isAdmin = user.role === "admin";
    document.getElementById("account-eyebrow").textContent = isAdmin ? "Administración" : "Mi cuenta";
    document.getElementById("account-name").textContent = user.name;
    document.getElementById("account-email").textContent = isAdmin ? "Panel de la nutricionista" : `${user.email} · ${user.phone} · ${user.locality}`;
    document.querySelectorAll(isAdmin ? "[data-customer-only]" : "[data-admin-only]").forEach((element) => element.remove());
    document.getElementById("logout-button").addEventListener("click", () => { window.KaizenStore.logout(); location.href = "index.html"; });
    bindAccountTabs();
    if (isAdmin) initAdminAccount();
    else initCustomerAccount();
  }

  function initCustomerAccount() {
    const orders = window.KaizenStore.getOrders();
    const appointments = window.KaizenStore.getAppointments();
    document.getElementById("order-count").textContent = orders.length;
    document.getElementById("appointment-count").textContent = appointments.length;
    document.getElementById("cart-summary-count").textContent = window.KaizenStore.getCartSummary().quantity;
    document.getElementById("orders-list").innerHTML = orders.length ? orders.map((order) => orderCard(order)).join("") : `<div class="empty-state"><h3>Todavía no hiciste pedidos</h3><a class="button small" href="tienda.html">Explorar productos</a></div>`;
    document.getElementById("appointments-list").innerHTML = appointments.length ? appointments.map((item) => appointmentCard(item)).join("") : `<div class="empty-state"><h3>Todavía no reservaste turnos</h3><a class="button small" href="nutricion.html">Ver agenda</a></div>`;
    renderAppointmentCalendar(appointments);
  }

  function initAdminAccount() {
    const orders = window.KaizenStore.getOrders(true);
    const appointments = window.KaizenStore.getAppointments(true).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    document.getElementById("admin-order-count").textContent = orders.length;
    document.getElementById("admin-appointment-count").textContent = appointments.filter((item) => item.status !== "Cancelado").length;
    document.getElementById("admin-pending-count").textContent = appointments.filter((item) => item.status === "Pendiente").length;
    document.getElementById("admin-product-count").textContent = window.KaizenStore.getCatalogProducts().length;
    document.getElementById("admin-orders").innerHTML = groupOrdersByMonthAndDay(orders);
    const list = document.getElementById("admin-appointments");
    list.innerHTML = appointments.length ? appointments.map((item) => appointmentCard(item, true)).join("") : `<div class="empty-state"><p>No hay turnos registrados.</p></div>`;
    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-appointment-status]");
      if (!button) return;
      window.KaizenStore.updateAppointmentStatus(button.dataset.appointmentId, button.dataset.appointmentStatus);
      location.reload();
    });
    initSchedule();
    initAdminCatalog();
  }

  function initAdminCatalog() {
    const form = document.getElementById("admin-product-form");
    if (!form) return;
    const search = document.getElementById("admin-product-search");
    const list = document.getElementById("admin-product-list");
    const pagination = document.getElementById("admin-product-pagination");
    const message = document.getElementById("admin-product-message");
    const categorySelect = document.getElementById("admin-product-category");
    const imageInput = document.getElementById("admin-product-image");
    const imageFile = document.getElementById("admin-product-image-file");
    const imagePreview = document.getElementById("admin-product-image-preview");
    const imageHelp = document.getElementById("admin-product-image-help");
    const imageDefault = document.getElementById("admin-product-image-default");
    const cancelButton = document.getElementById("admin-product-cancel");
    categorySelect.innerHTML = window.KAIZEN_CATEGORIES.map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`).join("");
    let page = 1;
    const pageSize = 24;
    const categoryImageName = () => window.KAIZEN_CATEGORIES.find((category) => category.name === categorySelect.value)?.image || "opciones-especiales.jpeg";
    const setImagePreview = (value, name = "producto", isCategoryDefault = false) => {
      imageInput.value = String(value || categoryImageName());
      imageInput.dataset.categoryDefault = String(isCategoryDefault);
      imagePreview.src = productImageSrc({ image: imageInput.value, category: categorySelect.value });
      imagePreview.alt = `Vista previa de ${name}`;
      imageHelp.textContent = isCategoryDefault ? "Se está usando la imagen general de la categoría." : "Imagen personalizada lista para guardar.";
    };
    const imageDataFromFile = (file) => new Promise((resolve, reject) => {
      if (!file || !/^image\/(?:jpeg|png|webp)$/i.test(file.type)) { reject(new Error("Elegí una imagen JPG, PNG o WebP.")); return; }
      if (file.size > 8 * 1024 * 1024) { reject(new Error("La imagen original no puede superar los 8 MB.")); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No pudimos leer la imagen seleccionada."));
      reader.onload = () => {
        const source = new Image();
        source.onerror = () => reject(new Error("El archivo seleccionado no es una imagen válida."));
        source.onload = () => {
          let limit = 960;
          let encoded = "";
          while (limit >= 480) {
            const scale = Math.min(1, limit / Math.max(source.naturalWidth, source.naturalHeight));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
            canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
            encoded = canvas.toDataURL("image/webp", limit > 700 ? .82 : .74);
            if (encoded.length <= 320000) break;
            limit = Math.floor(limit * .72);
          }
          if (!encoded || encoded.length > 380000) reject(new Error("La imagen sigue siendo demasiado pesada después de optimizarla."));
          else resolve(encoded);
        };
        source.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    const clearForm = () => {
      form.reset();
      document.getElementById("admin-product-id").value = "";
      document.getElementById("admin-product-form-title").textContent = "Agregar producto";
      document.getElementById("admin-product-stock").value = "";
      imageFile.value = "";
      setImagePreview(categoryImageName(), "nuevo producto", true);
      cancelButton.textContent = "Cancelar";
      form.dataset.mode = "new";
      form.hidden = false;
      message.textContent = "";
      message.className = "form-message";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const editProduct = (product) => {
      document.getElementById("admin-product-id").value = product.id;
      document.getElementById("admin-product-form-title").textContent = `Editar ${product.name}`;
      document.getElementById("admin-product-name").value = product.name;
      document.getElementById("admin-product-article").value = product.article;
      categorySelect.value = product.category;
      document.getElementById("admin-product-unit").value = product.unit;
      document.getElementById("admin-product-price").value = product.price || "";
      document.getElementById("admin-product-stock").value = product.stock ?? "";
      document.getElementById("admin-product-condition").value = product.condition || "";
      document.getElementById("admin-product-description").value = product.description || "";
      document.getElementById("admin-product-consult").checked = isConsultPrice(product);
      document.getElementById("admin-product-promotion").checked = Boolean(product.isPromotion);
      document.getElementById("admin-product-promotion-minimum").value = product.promotionMinimumQuantity || 1;
      const defaultImage = categoryImageName();
      const storedImage = String(product.image || "").replace(/^assets\//i, "");
      imageFile.value = "";
      setImagePreview(storedImage || defaultImage, product.name, !storedImage || storedImage === defaultImage);
      cancelButton.textContent = "Cancelar";
      form.dataset.mode = "edit";
      message.textContent = "";
      message.className = "form-message";
      form.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const render = () => {
      const query = search.value.trim().toLowerCase();
      const products = window.KaizenStore.getCatalogProducts().filter((product) => !query || `${product.name} ${product.article} ${product.category} ${product.unit}`.toLowerCase().includes(query));
      const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
      page = Math.min(page, totalPages);
      const visible = products.slice((page - 1) * pageSize, page * pageSize);
      list.innerHTML = visible.length ? visible.map((product) => `<article class="admin-product-row"><img class="admin-product-thumbnail" src="${escapeHtml(productImageSrc(product))}" alt=""><div class="admin-product-copy"><span class="product-meta">${escapeHtml(product.category)} · ${escapeHtml(product.article)}</span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.unit)} · ${productPriceLabel(product)} · ${escapeHtml(window.KaizenStore.stockLabel(product))}</small></div><div class="cluster admin-product-actions"><button class="button ghost small" type="button" data-edit-product="${product.id}">Editar</button><button class="button danger-outline small" type="button" data-remove-product="${product.id}">Quitar</button></div></article>`).join("") : `<div class="empty-state"><p>No encontramos productos.</p></div>`;
      pagination.innerHTML = products.length > pageSize ? `<button class="button ghost small" type="button" data-admin-product-page="${page - 1}" ${page === 1 ? "disabled" : ""}>‹ Anterior</button><span>Página ${page} de ${totalPages} · ${products.length} variantes</span><button class="button ghost small" type="button" data-admin-product-page="${page + 1}" ${page === totalPages ? "disabled" : ""}>Siguiente ›</button>` : `<span>${products.length} variantes</span>`;
    };
    document.getElementById("admin-product-new").addEventListener("click", clearForm);
    cancelButton.addEventListener("click", () => { form.hidden = true; message.textContent = ""; cancelButton.textContent = "Cancelar"; });
    imageDefault.addEventListener("click", () => { imageFile.value = ""; setImagePreview(categoryImageName(), document.getElementById("admin-product-name").value || "producto", true); });
    categorySelect.addEventListener("change", () => { if (imageInput.dataset.categoryDefault === "true") setImagePreview(categoryImageName(), document.getElementById("admin-product-name").value || "producto", true); });
    imageFile.addEventListener("change", async () => {
      const [file] = imageFile.files;
      if (!file) return;
      message.textContent = "Optimizando imagen…";
      message.className = "form-message";
      try {
        const image = await imageDataFromFile(file);
        setImagePreview(image, document.getElementById("admin-product-name").value || file.name, false);
        message.textContent = "Imagen lista. Guardá el producto para aplicar el cambio.";
        message.className = "form-message success";
      } catch (error) {
        imageFile.value = "";
        message.textContent = error.message;
        message.className = "form-message error";
      }
    });
    search.addEventListener("input", () => { page = 1; render(); });
    pagination.addEventListener("click", (event) => { const button = event.target.closest("[data-admin-product-page]"); if (button && !button.disabled) { page = Number(button.dataset.adminProductPage); render(); } });
    list.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-edit-product]");
      if (editButton) { const product = window.KaizenStore.getCatalogProducts().find((item) => item.id === Number(editButton.dataset.editProduct)); if (product) editProduct(product); return; }
      const removeButton = event.target.closest("[data-remove-product]");
      if (!removeButton) return;
      const product = window.KaizenStore.getCatalogProducts().find((item) => item.id === Number(removeButton.dataset.removeProduct));
      if (product && window.confirm(`¿Quitar ${product.name} (${product.article}) del catálogo?`)) { window.KaizenStore.removeCatalogProduct(product.id); toast("Producto quitado del catálogo."); render(); }
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const product = window.KaizenStore.saveCatalogProduct({
          id: document.getElementById("admin-product-id").value || null,
          name: document.getElementById("admin-product-name").value,
          article: document.getElementById("admin-product-article").value,
          category: categorySelect.value,
          unit: document.getElementById("admin-product-unit").value,
          price: document.getElementById("admin-product-price").value,
          stock: document.getElementById("admin-product-stock").value,
          condition: document.getElementById("admin-product-condition").value,
          description: document.getElementById("admin-product-description").value,
          image: imageInput.value,
          priceStatus: document.getElementById("admin-product-consult").checked ? "consult" : "available",
          isPromotion: document.getElementById("admin-product-promotion").checked,
          promotionMinimumQuantity: document.getElementById("admin-product-promotion-minimum").value
        });
        message.textContent = `${product.name} guardado correctamente.`;
        message.className = "form-message success";
        document.getElementById("admin-product-id").value = product.id;
        document.getElementById("admin-product-form-title").textContent = `Editar ${product.name}`;
        setImagePreview(product.image, product.name, String(product.image || "").replace(/^assets\//i, "") === categoryImageName());
        cancelButton.textContent = "Cerrar";
        form.dataset.mode = "edit";
        document.getElementById("admin-product-count").textContent = window.KaizenStore.getCatalogProducts().length;
        render();
      } catch (error) { message.textContent = error.message; message.className = "form-message error"; }
    });
    render();
  }

  function initSchedule() {
    const schedule = window.KaizenStore.getSchedule();
    const mode = document.getElementById("schedule-mode");
    mode.value = schedule.mode;
    const baseTimes = Array.from({ length: 37 }, (_, index) => {
      const minutes = 8 * 60 + index * 20;
      return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    });
    const channels = [
      { key: "presential", timesId: "schedule-presential-times" },
      { key: "virtual", timesId: "schedule-virtual-times" }
    ];
    channels.forEach(({ key, timesId }) => {
      const availableTimes = [...new Set([...baseTimes, ...schedule[key].times])].sort();
      document.getElementById(timesId).innerHTML = availableTimes.map((time) => `<label class="time-check"><input type="checkbox" data-schedule-time="${key}" value="${time}" ${schedule[key].times.includes(time) ? "checked" : ""}><span>${time}</span></label>`).join("");
      document.querySelectorAll(`[data-schedule-weekday="${key}"]`).forEach((checkbox) => { checkbox.checked = schedule[key].weekdays.includes(Number(checkbox.value)); });
    });
    document.getElementById("schedule-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const parsed = Object.fromEntries(channels.map(({ key }) => [key, {
        weekdays: [...document.querySelectorAll(`[data-schedule-weekday="${key}"]:checked`)].map((item) => Number(item.value)),
        times: [...document.querySelectorAll(`[data-schedule-time="${key}"]:checked`)].map((item) => item.value).sort()
      }]));
      const message = document.getElementById("schedule-message");
      if (channels.some(({ key }) => !parsed[key].weekdays.length || !parsed[key].times.length)) { message.textContent = "Elegí al menos un día y un horario para cada modalidad."; message.className = "form-message error"; return; }
      window.KaizenStore.saveSchedule({ mode: mode.value, ...parsed });
      message.textContent = "Configuración guardada.";
      message.className = "form-message success";
    });
  }

  function registerWebMCP() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const tools = [
      {
        name: "search_catalog", title: "Buscar en el catálogo", description: "Busca productos de Kaizen por nombre, artículo o categoría sin modificar el carrito.",
        inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute({ query }) { const term = String(query || "").toLowerCase(); return window.KAIZEN_PRODUCTS.filter((item) => `${item.name} ${item.article} ${item.category}`.toLowerCase().includes(term)).map(({ id, article, name, category, price }) => ({ id, article, name, category, price })); }
      },
      {
        name: "add_product_to_cart", title: "Agregar producto al carrito", description: "Agrega una cantidad de un producto identificado por su ID al carrito visible de Kaizen.",
        inputSchema: { type: "object", properties: { productId: { type: "integer" }, quantity: { type: "integer", minimum: 1 } }, required: ["productId"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute({ productId, quantity = 1 }) { return window.KaizenStore.addToCart(productId, quantity); }
      }
    ];
    tools.forEach((tool) => { try { context.registerTool(tool); } catch (_) { /* Browser without WebMCP support. */ } });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await window.KaizenStore.initialize();
    document.getElementById("site-shell").innerHTML = headerMarkup();
    document.getElementById("site-footer").innerHTML = footerMarkup();
    bindGlobalEvents();
    updateCartBadge();
    initHome();
    initShop();
    initNutrition();
    initAuth();
    initCart();
    initAccount();
    registerWebMCP();
  });

  window.KaizenUI = { money, productCard, toast };
})();
