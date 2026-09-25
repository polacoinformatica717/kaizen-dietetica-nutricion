(function () {
  const KEYS = {
    users: "kaizen_users_v1",
    session: "kaizen_session_v1",
    cart: "kaizen_cart_v2",
    orders: "kaizen_orders_v1",
    appointments: "kaizen_appointments_v1",
    schedule: "kaizen_schedule_v1",
    addresses: "kaizen_addresses_v1",
    catalog: "kaizen_catalog_v1"
  };

  const BASE_PRODUCTS = Array.isArray(window.KAIZEN_PRODUCTS) ? window.KAIZEN_PRODUCTS.map((product) => ({ ...product, stock: product.stock ?? null })) : [];

  const DEFAULT_SCHEDULE = {
    mode: "auto",
    presential: { weekdays: [1, 2, 3, 4, 5], times: ["09:00", "10:30", "15:00", "16:30", "18:00"] },
    virtual: { weekdays: [1, 2, 3, 4, 5], times: ["09:00", "10:30", "15:00", "16:30", "18:00"] }
  };

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const defaultCatalogState = () => ({ edits: {}, custom: [], deletedIds: [] });
  const normalizeCatalogState = (state = {}) => ({
    edits: state.edits && typeof state.edits === "object" ? state.edits : {},
    custom: Array.isArray(state.custom) ? state.custom : [],
    deletedIds: Array.isArray(state.deletedIds) ? [...new Set(state.deletedIds.map(Number))] : []
  });
  const catalogState = () => normalizeCatalogState(read(KEYS.catalog, defaultCatalogState()));
  const normalizeStock = (value) => value === "" || value === null || value === undefined ? null : Math.max(0, Math.floor(Number(value) || 0));
  const normalizeProductImage = (value) => {
    const image = String(value || "").trim();
    if (!image) return "";
    if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(image)) {
      if (image.length > 380000) throw new Error("La imagen es demasiado pesada. Elegí una foto más liviana.");
      return image;
    }
    if (/^(?:assets\/)?[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp|gif|avif)$/i.test(image)) return image.replace(/^assets\//i, "");
    throw new Error("La imagen seleccionada no tiene un formato válido.");
  };
  function getCatalogProducts() {
    const state = catalogState();
    const removed = new Set(state.deletedIds);
    return [
      ...BASE_PRODUCTS.filter((product) => !removed.has(product.id)).map((product) => ({ ...product, ...(state.edits[product.id] || {}), stock: normalizeStock((state.edits[product.id] || {}).stock ?? product.stock) })),
      ...state.custom.filter((product) => !removed.has(product.id)).map((product) => ({ ...product, stock: normalizeStock(product.stock) }))
    ];
  }
  const refreshCatalogCache = () => { window.KAIZEN_PRODUCTS = getCatalogProducts(); return window.KAIZEN_PRODUCTS; };
  const findProduct = (productId) => getCatalogProducts().find((item) => item.id === Number(productId));
  const productHasManagedStock = (product) => Number.isInteger(product?.stock);
  const stockLabel = (product) => productHasManagedStock(product) ? `${product.stock} unidades` : "Sin control de stock";
  function persistCatalogProduct(product) {
    const state = catalogState();
    const base = BASE_PRODUCTS.find((item) => item.id === Number(product.id));
    if (base) state.edits[base.id] = { ...state.edits[base.id], ...product, id: base.id };
    else {
      const index = state.custom.findIndex((item) => item.id === Number(product.id));
      if (index >= 0) state.custom[index] = product;
      else state.custom.push(product);
    }
    state.deletedIds = state.deletedIds.filter((id) => id !== Number(product.id));
    write(KEYS.catalog, state);
    refreshCatalogCache();
    return findProduct(product.id);
  }
  const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
  const normalizeScheduleChannel = (channel, fallback) => {
    const weekdays = Array.isArray(channel?.weekdays) ? [...new Set(channel.weekdays.map(Number).filter((day) => day >= 0 && day <= 6))] : fallback.weekdays;
    const times = Array.isArray(channel?.times) ? [...new Set(channel.times.filter((time) => /^\d{2}:\d{2}$/.test(time)))].sort() : fallback.times;
    return { weekdays: weekdays.length ? weekdays : fallback.weekdays, times: times.length ? times : fallback.times };
  };
  const normalizeSchedule = (schedule = {}) => {
    const legacyChannel = Array.isArray(schedule.weekdays) && Array.isArray(schedule.times) ? { weekdays: schedule.weekdays, times: schedule.times } : null;
    return {
      mode: schedule.mode === "pending" ? "pending" : "auto",
      presential: normalizeScheduleChannel(schedule.presential || legacyChannel, DEFAULT_SCHEDULE.presential),
      virtual: normalizeScheduleChannel(schedule.virtual, DEFAULT_SCHEDULE.virtual)
    };
  };

  async function hashPassword(password) {
    if (window.crypto?.subtle) {
      const bytes = new TextEncoder().encode(password);
      const hash = await window.crypto.subtle.digest("SHA-256", bytes);
      return [...new Uint8Array(hash)].map((item) => item.toString(16).padStart(2, "0")).join("");
    }
    return btoa(unescape(encodeURIComponent(password)));
  }

  function normalizeUser(user) {
    const demoDefaults = user.id === "usr-demo" ? { birthDate: "1992-06-12", phone: "11 5555 0101", locality: "Localidad de prueba" } : user.id === "usr-admin" ? { birthDate: "1990-01-01", phone: "11 5555 0202", locality: "Consultorio Kaizen" } : {};
    const preferred = (value, fallback) => !value || value === "A confirmar" ? fallback : value;
    const { contactEmail: _legacyContactEmail, ...baseUser } = user;
    return {
      ...baseUser,
      birthDate: preferred(user.birthDate, demoDefaults.birthDate || "1990-01-01"),
      phone: preferred(user.phone, demoDefaults.phone || "A confirmar"),
      locality: preferred(user.locality, demoDefaults.locality || "A confirmar")
    };
  }

  async function initialize() {
    localStorage.removeItem("kaizen_cart_v1");
    let users = read(KEYS.users, []);
    if (!users.length) {
      users = [
        { id: "usr-demo", name: "Cliente Demo", email: "cliente@kaizen.demo", birthDate: "1992-06-12", phone: "11 5555 0101", locality: "Localidad de prueba", passwordHash: await hashPassword("Demo1234"), role: "customer", createdAt: new Date().toISOString() },
        { id: "usr-admin", name: "Equipo Kaizen", email: "admin@kaizen.demo", birthDate: "1990-01-01", phone: "11 5555 0202", locality: "Consultorio Kaizen", passwordHash: await hashPassword("Admin1234"), role: "admin", createdAt: new Date().toISOString() }
      ];
    } else {
      users = users.map(normalizeUser);
    }
    write(KEYS.users, users);
    const session = read(KEYS.session, null);
    if (session) {
      const current = users.find((user) => user.id === session.id);
      if (current) write(KEYS.session, publicUser(current));
    }
    write(KEYS.schedule, normalizeSchedule(read(KEYS.schedule, DEFAULT_SCHEDULE)));
    refreshCatalogCache();
  }

  async function register({ name, email, password, birthDate, phone, locality }) {
    const users = read(KEYS.users, []);
    const cleanEmail = normalizeEmail(email);
    if (users.some((user) => user.email === cleanEmail)) throw new Error("Ya existe una cuenta con ese correo.");
    if (String(name).trim().length < 2) throw new Error("Ingresá tu nombre y apellido.");
    if (!cleanEmail.includes("@")) throw new Error("Ingresá un correo electrónico válido.");
    if (!birthDate) throw new Error("Ingresá tu fecha de nacimiento.");
    if (String(phone).trim().length < 6) throw new Error("Ingresá un número de contacto válido.");
    if (String(locality).trim().length < 2) throw new Error("Ingresá tu localidad.");
    if (String(password).length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
    const user = {
      id: `usr-${Date.now()}`,
      name: String(name).trim(),
      email: cleanEmail,
      birthDate,
      phone: String(phone).trim(),
      locality: String(locality).trim(),
      passwordHash: await hashPassword(password),
      role: "customer",
      createdAt: new Date().toISOString()
    };
    users.push(user);
    write(KEYS.users, users);
    setSession(user);
    return publicUser(user);
  }

  async function login(email, password) {
    const cleanEmail = normalizeEmail(email);
    const passwordHash = await hashPassword(password);
    const user = read(KEYS.users, []).find((item) => item.email === cleanEmail && item.passwordHash === passwordHash);
    if (!user) throw new Error("El correo o la contraseña no coinciden.");
    setSession(normalizeUser(user));
    return publicUser(normalizeUser(user));
  }

  function publicUser(user) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = normalizeUser(user);
    return safeUser;
  }
  function setSession(user) { write(KEYS.session, publicUser(user)); window.dispatchEvent(new CustomEvent("kaizen:session")); }
  function getSession() { return read(KEYS.session, null); }
  function logout() { localStorage.removeItem(KEYS.session); window.dispatchEvent(new CustomEvent("kaizen:session")); }
  function requireCustomer(action) {
    const session = getSession();
    if (session?.role === "admin") throw new Error(`La cuenta de administración no puede ${action}.`);
    return session;
  }

  function isConsultProduct(product) {
    return product?.priceStatus === "consult" || Number(product?.price) <= 0;
  }
  function productPromotionKey(product) {
    return product?.promotionKey || (product?.isPromotion ? product.article : null);
  }
  function hasUsedProductPromotion(productId, userId = null) {
    const product = findProduct(productId);
    const key = productPromotionKey(product);
    const session = getSession();
    const customerId = userId || (session?.role === "customer" ? session.id : null);
    if (!key || !customerId) return false;
    return read(KEYS.orders, []).some((order) => order.userId === customerId && order.items?.some((item) => item.promotionKey === key));
  }

  function getCart() { return read(KEYS.cart, []); }
  function saveCart(cart) { write(KEYS.cart, cart); window.dispatchEvent(new CustomEvent("kaizen:cart")); }
  function addToCart(productId, quantity = 1) {
    const session = requireCustomer("realizar compras");
    const product = findProduct(productId);
    if (!product) throw new Error("Producto no encontrado.");
    if (isConsultProduct(product)) throw new Error("Este producto requiere consultar el precio antes de comprar.");
    if (product.isPromotion && !session) throw new Error("Iniciá sesión para utilizar una promoción.");
    if (product.isPromotion && hasUsedProductPromotion(product.id, session?.id)) throw new Error("Esta promoción ya fue utilizada por esta cuenta.");
    const minimum = product.isPromotion ? Math.max(1, Number(product.promotionMinimumQuantity) || 1) : 1;
    const requested = Math.max(minimum, Number(quantity) || 1);
    const cart = getCart();
    const line = cart.find((item) => item.id === product.id);
    const nextQuantity = line ? Math.max(minimum, line.quantity + Math.max(1, Number(quantity) || 1)) : requested;
    if (productHasManagedStock(product) && nextQuantity > product.stock) throw new Error(`Solo quedan ${product.stock} unidades disponibles.`);
    if (line) line.quantity = nextQuantity;
    else cart.push({ id: product.id, quantity: nextQuantity });
    saveCart(cart);
    return getCartSummary();
  }
  function updateCart(productId, quantity) {
    requireCustomer("modificar el carrito");
    let cart = getCart();
    const id = Number(productId);
    const product = findProduct(id);
    if (!product) throw new Error("Producto no encontrado.");
    if (quantity <= 0) cart = cart.filter((item) => item.id !== id);
    else {
      const minimum = product.isPromotion ? Math.max(1, Number(product.promotionMinimumQuantity) || 1) : 1;
      const nextQuantity = Math.max(minimum, Number(quantity) || minimum);
      if (productHasManagedStock(product) && nextQuantity > product.stock) throw new Error(`Solo quedan ${product.stock} unidades disponibles.`);
      cart = cart.map((item) => item.id === id ? { ...item, quantity: nextQuantity } : item);
    }
    saveCart(cart);
    return getCartSummary();
  }
  function clearCart() { saveCart([]); }
  function getCartSummary() {
    const products = getCatalogProducts();
    const lines = getCart().map((line) => ({ ...line, product: products.find((item) => item.id === line.id) })).filter((line) => line.product);
    return {
      lines,
      quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
      total: lines.reduce((sum, line) => sum + line.quantity * line.product.price, 0)
    };
  }

  function normalizeDeliveryAddress(address = {}) {
    return {
      street: String(address.street || "").trim(),
      number: String(address.number || "").trim(),
      floorApartment: String(address.floorApartment || "").trim(),
      locality: String(address.locality || "").trim(),
      postalCode: String(address.postalCode || "").trim(),
      reference: String(address.reference || "").trim()
    };
  }

  function getDeliveryAddress() {
    const user = getSession();
    if (!user || user.role !== "customer") return normalizeDeliveryAddress();
    const saved = read(KEYS.addresses, {});
    return normalizeDeliveryAddress(saved[user.id] || { locality: user.locality });
  }

  function saveDeliveryAddress(address) {
    const user = requireCustomer("guardar un domicilio de entrega");
    if (!user) throw new Error("Necesitás iniciar sesión para guardar el domicilio.");
    const normalized = normalizeDeliveryAddress(address);
    if (!normalized.street) throw new Error("Ingresá la calle del domicilio de entrega.");
    if (!normalized.number) throw new Error("Ingresá la altura o número del domicilio.");
    if (!normalized.locality) throw new Error("Ingresá la localidad de entrega.");
    const saved = read(KEYS.addresses, {});
    saved[user.id] = normalized;
    write(KEYS.addresses, saved);
    return normalized;
  }

  function placeOrder({ payment, delivery, address = {}, notes = "" }) {
    const user = requireCustomer("realizar pedidos");
    if (!user) throw new Error("Necesitás iniciar sesión para finalizar la compra.");
    const cart = getCartSummary();
    if (!cart.lines.length) throw new Error("El carrito está vacío.");
    for (const line of cart.lines) {
      if (productHasManagedStock(line.product) && line.quantity > line.product.stock) throw new Error(`No hay stock suficiente de ${line.product.name}. Disponible: ${line.product.stock}.`);
    }
    for (const line of cart.lines.filter((item) => item.product.isPromotion)) {
      if (hasUsedProductPromotion(line.product.id, user.id)) throw new Error(`La promoción ${line.product.name} ya fue utilizada por esta cuenta.`);
      const minimum = Math.max(1, Number(line.product.promotionMinimumQuantity) || 1);
      if (line.quantity < minimum) throw new Error(`La promoción ${line.product.name} requiere una cantidad mínima de ${minimum}.`);
    }
    const paymentLabels = { mp: "Mercado Pago", whatsapp: "Coordinación por WhatsApp" };
    const deliveryLabels = { pickup: "Retiro en el local", delivery: "Envío a domicilio" };
    if (!paymentLabels[payment]) throw new Error("Elegí un medio de pago.");
    if (!deliveryLabels[delivery]) throw new Error("Elegí retiro o envío.");
    const deliveryAddress = delivery === "delivery" ? saveDeliveryAddress(address) : null;
    const order = {
      id: `KZ-${String(Date.now()).slice(-7)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      userLocality: user.locality,
      createdAt: new Date().toISOString(),
      payment: paymentLabels[payment],
      delivery: deliveryLabels[delivery],
      status: payment === "mp" ? "Confirmado" : "A coordinar",
      paymentKey: payment,
      deliveryKey: delivery,
      address: deliveryAddress,
      notes: String(notes).trim(),
      items: cart.lines.map((line) => ({ id: line.product.id, article: line.product.article, name: line.product.name, price: line.product.price, quantity: line.quantity, isPromotion: Boolean(line.product.isPromotion), promotionKey: productPromotionKey(line.product), promotionMinimumQuantity: line.product.promotionMinimumQuantity || null })),
      total: cart.total
    };
    const orders = read(KEYS.orders, []);
    orders.unshift(order);
    write(KEYS.orders, orders);
    cart.lines.filter((line) => productHasManagedStock(line.product)).forEach((line) => persistCatalogProduct({ ...line.product, stock: line.product.stock - line.quantity }));
    clearCart();
    return order;
  }
  function getOrders(all = false) {
    const session = getSession();
    const orders = read(KEYS.orders, []);
    if (all && session?.role === "admin") return orders;
    return session?.role === "customer" ? orders.filter((order) => order.userId === session.id) : [];
  }

  function getSchedule() { return normalizeSchedule(read(KEYS.schedule, DEFAULT_SCHEDULE)); }
  function saveSchedule(schedule) {
    const session = getSession();
    if (session?.role !== "admin") throw new Error("Solo el equipo de Kaizen puede modificar la agenda.");
    const normalized = normalizeSchedule(schedule);
    write(KEYS.schedule, normalized);
    return normalized;
  }

  const PROMO_TYPE = "Consulta inicial + 2 Controles";
  const isPromoType = (type) => String(type || "").trim().toLocaleLowerCase("es-AR") === PROMO_TYPE.toLocaleLowerCase("es-AR");
  const appointmentDurationMinutes = (type) => String(type || "").toLocaleLowerCase("es-AR").includes("control") && !isPromoType(type) ? 20 : 40;
  const normalizeModality = (modality) => String(modality || "").toLocaleLowerCase("es-AR") === "virtual" ? "Virtual" : String(modality || "").toLocaleLowerCase("es-AR") === "presencial" ? "Presencial" : "";
  const scheduleChannel = (schedule, modality) => modality === "Virtual" ? schedule.virtual : schedule.presential;
  const addDaysToIso = (date, days) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + days);
    return next.toISOString().slice(0, 10);
  };
  const timeToMinutes = (time) => {
    const [hours, minutes] = String(time || "").split(":").map(Number);
    return hours * 60 + minutes;
  };
  const intervalsOverlap = (startA, durationA, startB, durationB) => startA < startB + durationB && startB < startA + durationA;
  const appointmentPlan = (type, date, time) => isPromoType(type) ? [
    { type: PROMO_TYPE, date, time, durationMinutes: 40, seriesPosition: 1 },
    { type: "Control nutricional · Promoción 1/2", date: addDaysToIso(date, 7), time, durationMinutes: 20, seriesPosition: 2 },
    { type: "Control nutricional · Promoción 2/2", date: addDaysToIso(date, 14), time, durationMinutes: 20, seriesPosition: 3 }
  ] : [{ type, date, time, durationMinutes: appointmentDurationMinutes(type), seriesPosition: 1 }];
  const planItemIsAvailable = (item, channel, appointments) => {
    const selectedDate = new Date(`${item.date}T12:00:00`);
    if (!channel.weekdays.includes(selectedDate.getDay()) || !channel.times.includes(item.time)) return false;
    return !appointments.some((appointment) => appointment.date === item.date && appointment.status !== "Cancelado" && intervalsOverlap(timeToMinutes(item.time), item.durationMinutes, timeToMinutes(appointment.time), Number(appointment.durationMinutes) || appointmentDurationMinutes(appointment.type)));
  };

  function getOccupiedSlots(date, modality = "Presencial", type = "Control nutricional") {
    const normalizedModality = normalizeModality(modality) || "Presencial";
    const channel = scheduleChannel(getSchedule(), normalizedModality);
    const appointments = read(KEYS.appointments, []);
    return channel.times.filter((time) => appointmentPlan(type, date, time).some((item) => !planItemIsAvailable(item, channel, appointments)));
  }

  function hasUsedPromo() {
    const user = getSession();
    if (!user || user.role !== "customer") return false;
    return read(KEYS.appointments, []).some((item) => item.userId === user.id && (isPromoType(item.type) || String(item.seriesId || "").startsWith("PROMO-")));
  }

  function createAppointment({ type, modality, date, time, notes = "" }) {
    const user = requireCustomer("reservar turnos");
    if (!user) throw new Error("Necesitás iniciar sesión para reservar un turno.");
    if (!type || !modality || !date || !time) throw new Error("Completá el tipo de consulta, modalidad, fecha y horario.");
    const normalizedType = isPromoType(type) ? PROMO_TYPE : type;
    const normalizedModality = normalizeModality(modality);
    if (!normalizedModality) throw new Error("Elegí una modalidad válida.");
    if (isPromoType(normalizedType) && hasUsedPromo()) throw new Error("La promoción Consulta inicial + 2 Controles es de un único uso por cliente.");
    const schedule = getSchedule();
    const channel = scheduleChannel(schedule, normalizedModality);
    const appointments = read(KEYS.appointments, []);
    const plan = appointmentPlan(normalizedType, date, time);
    const unavailable = plan.find((item) => !planItemIsAvailable(item, channel, appointments));
    if (unavailable) {
      const suffix = isPromoType(normalizedType) && unavailable.date !== date ? ` El control del ${unavailable.date} a las ${time} no está disponible.` : "";
      throw new Error(`Ese horario no está disponible o acaba de ocuparse.${suffix}`);
    }
    const timestamp = Date.now();
    const createdAt = new Date(timestamp).toISOString();
    const seriesId = isPromoType(normalizedType) ? `PROMO-${user.id}-${timestamp}` : null;
    const booked = plan.map((item, index) => ({
      id: `T-${String(timestamp).slice(-7)}${plan.length > 1 ? `-${index + 1}` : ""}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      userLocality: user.locality,
      createdAt,
      type: item.type,
      modality: normalizedModality,
      durationMinutes: item.durationMinutes,
      date: item.date,
      time: item.time,
      notes: String(notes).trim(),
      status: schedule.mode === "auto" ? "Confirmado" : "Pendiente",
      ...(seriesId ? { seriesId, seriesPosition: item.seriesPosition, seriesSize: plan.length, promotionName: PROMO_TYPE } : {})
    }));
    write(KEYS.appointments, [...booked, ...appointments]);
    return { ...booked[0], bundleAppointments: booked };
  }
  function getAppointments(all = false) {
    const session = getSession();
    const appointments = read(KEYS.appointments, []);
    if (all && session?.role === "admin") return appointments;
    return session?.role === "customer" ? appointments.filter((item) => item.userId === session.id) : [];
  }
  function updateAppointmentStatus(id, status) {
    const session = getSession();
    if (session?.role !== "admin") throw new Error("Acción no permitida.");
    const appointments = read(KEYS.appointments, []).map((item) => item.id === id ? { ...item, status } : item);
    write(KEYS.appointments, appointments);
  }

  function saveCatalogProduct(input = {}) {
    const session = getSession();
    if (session?.role !== "admin") throw new Error("Solo la administración puede modificar el catálogo.");
    const products = getCatalogProducts();
    const existing = input.id ? products.find((item) => item.id === Number(input.id)) : null;
    const name = String(input.name || "").trim();
    const article = String(input.article || "").trim().toUpperCase();
    const category = String(input.category || "").trim();
    const unit = String(input.unit || "").trim();
    if (name.length < 2) throw new Error("Ingresá el nombre del producto.");
    if (!article) throw new Error("Ingresá un código de artículo.");
    if (products.some((item) => item.article.toUpperCase() === article && item.id !== existing?.id)) throw new Error("Ya existe un producto con ese código de artículo.");
    if (!window.KAIZEN_CATEGORIES.some((item) => item.name === category)) throw new Error("Elegí una categoría válida.");
    if (!unit) throw new Error("Ingresá la presentación o unidad.");
    const priceStatus = input.priceStatus === "consult" ? "consult" : "available";
    const price = priceStatus === "consult" ? 0 : Math.max(0, Number(input.price) || 0);
    if (priceStatus === "available" && price <= 0) throw new Error("Ingresá un precio mayor que cero o marcá precio a consultar.");
    const id = existing?.id || Math.max(0, ...BASE_PRODUCTS.map((item) => item.id), ...catalogState().custom.map((item) => Number(item.id) || 0)) + 1;
    const isPromotion = Boolean(input.isPromotion);
    const categoryImage = window.KAIZEN_CATEGORIES.find((item) => item.name === category)?.image || "opciones-especiales.jpeg";
    const image = normalizeProductImage(Object.prototype.hasOwnProperty.call(input, "image") ? input.image : existing?.image) || categoryImage;
    return persistCatalogProduct({
      ...(existing || {}),
      id,
      article,
      name,
      description: String(input.description || `${name}. Presentación: ${unit}.`).trim(),
      category,
      price,
      unit,
      condition: String(input.condition || "").trim(),
      priceStatus,
      image,
      isPromotion,
      promotionKey: isPromotion ? (existing?.promotionKey || article) : null,
      promotionMinimumQuantity: isPromotion ? Math.max(1, Number(input.promotionMinimumQuantity) || 1) : 1,
      promotionLimitPerCustomer: isPromotion ? 1 : null,
      stock: normalizeStock(input.stock),
      sourceRow: existing?.sourceRow || null,
      custom: existing?.custom || !BASE_PRODUCTS.some((item) => item.id === id)
    });
  }

  function removeCatalogProduct(productId) {
    const session = getSession();
    if (session?.role !== "admin") throw new Error("Solo la administración puede quitar productos.");
    const product = findProduct(productId);
    if (!product) throw new Error("Producto no encontrado.");
    const state = catalogState();
    if (BASE_PRODUCTS.some((item) => item.id === product.id)) state.deletedIds = [...new Set([...state.deletedIds, product.id])];
    else state.custom = state.custom.filter((item) => item.id !== product.id);
    write(KEYS.catalog, state);
    refreshCatalogCache();
    return product;
  }

  window.KaizenStore = {
    initialize, register, login, getSession, logout,
    getCart, addToCart, updateCart, clearCart, getCartSummary, hasUsedProductPromotion,
    getDeliveryAddress, saveDeliveryAddress, placeOrder, getOrders,
    getSchedule, saveSchedule, getOccupiedSlots, hasUsedPromo, createAppointment, getAppointments, updateAppointmentStatus,
    getCatalogProducts, saveCatalogProduct, removeCatalogProduct, stockLabel
  };
})();
