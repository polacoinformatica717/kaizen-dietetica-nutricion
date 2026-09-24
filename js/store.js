(function () {
  const KEYS = {
    users: "kaizen_users_v1",
    session: "kaizen_session_v1",
    cart: "kaizen_cart_v2",
    orders: "kaizen_orders_v1",
    appointments: "kaizen_appointments_v1",
    schedule: "kaizen_schedule_v1",
    addresses: "kaizen_addresses_v1"
  };

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
    const product = window.KAIZEN_PRODUCTS.find((item) => item.id === Number(productId));
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
    const product = window.KAIZEN_PRODUCTS.find((item) => item.id === Number(productId));
    if (!product) throw new Error("Producto no encontrado.");
    if (isConsultProduct(product)) throw new Error("Este producto requiere consultar el precio antes de comprar.");
    if (product.isPromotion && !session) throw new Error("Iniciá sesión para utilizar una promoción.");
    if (product.isPromotion && hasUsedProductPromotion(product.id, session?.id)) throw new Error("Esta promoción ya fue utilizada por esta cuenta.");
    const minimum = product.isPromotion ? Math.max(1, Number(product.promotionMinimumQuantity) || 1) : 1;
    const requested = Math.max(minimum, Number(quantity) || 1);
    const cart = getCart();
    const line = cart.find((item) => item.id === product.id);
    if (line) line.quantity = Math.max(minimum, line.quantity + Math.max(1, Number(quantity) || 1));
    else cart.push({ id: product.id, quantity: requested });
    saveCart(cart);
    return getCartSummary();
  }
  function updateCart(productId, quantity) {
    requireCustomer("modificar el carrito");
    let cart = getCart();
    const id = Number(productId);
    const product = window.KAIZEN_PRODUCTS.find((item) => item.id === id);
    if (!product) throw new Error("Producto no encontrado.");
    if (quantity <= 0) cart = cart.filter((item) => item.id !== id);
    else {
      const minimum = product.isPromotion ? Math.max(1, Number(product.promotionMinimumQuantity) || 1) : 1;
      cart = cart.map((item) => item.id === id ? { ...item, quantity: Math.max(minimum, Number(quantity) || minimum) } : item);
    }
    saveCart(cart);
    return getCartSummary();
  }
  function clearCart() { saveCart([]); }
  function getCartSummary() {
    const lines = getCart().map((line) => ({ ...line, product: window.KAIZEN_PRODUCTS.find((item) => item.id === line.id) })).filter((line) => line.product);
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
  const timeToMinutes = (time) => {
    const [hours, minutes] = String(time || "").split(":").map(Number);
    return hours * 60 + minutes;
  };
  const intervalsOverlap = (startA, durationA, startB, durationB) => startA < startB + durationB && startB < startA + durationA;

  function getOccupiedSlots(date, modality = "Presencial", type = "Control nutricional") {
    const normalizedModality = normalizeModality(modality) || "Presencial";
    const duration = appointmentDurationMinutes(type);
    const candidates = scheduleChannel(getSchedule(), normalizedModality).times;
    const appointments = read(KEYS.appointments, []).filter((item) => item.date === date && item.status !== "Cancelado");
    return candidates.filter((time) => appointments.some((item) => intervalsOverlap(timeToMinutes(time), duration, timeToMinutes(item.time), Number(item.durationMinutes) || appointmentDurationMinutes(item.type))));
  }

  function hasUsedPromo() {
    const user = getSession();
    if (!user || user.role !== "customer") return false;
    return read(KEYS.appointments, []).some((item) => item.userId === user.id && isPromoType(item.type));
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
    const selectedDate = new Date(`${date}T12:00:00`);
    if (!channel.weekdays.includes(selectedDate.getDay()) || !channel.times.includes(time)) throw new Error("Ese horario no está disponible para la modalidad elegida.");
    const durationMinutes = appointmentDurationMinutes(normalizedType);
    const appointment = {
      id: `T-${String(Date.now()).slice(-7)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      userLocality: user.locality,
      createdAt: new Date().toISOString(),
      type: normalizedType,
      modality: normalizedModality,
      durationMinutes,
      date,
      time,
      notes: String(notes).trim(),
      status: schedule.mode === "auto" ? "Confirmado" : "Pendiente"
    };
    const appointments = read(KEYS.appointments, []);
    const occupied = appointments.some((item) => item.date === date && item.status !== "Cancelado" && intervalsOverlap(timeToMinutes(time), durationMinutes, timeToMinutes(item.time), Number(item.durationMinutes) || appointmentDurationMinutes(item.type)));
    if (occupied) throw new Error("Ese horario acaba de ocuparse. Elegí otro disponible.");
    appointments.unshift(appointment);
    write(KEYS.appointments, appointments);
    return appointment;
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

  window.KaizenStore = {
    initialize, register, login, getSession, logout,
    getCart, addToCart, updateCart, clearCart, getCartSummary, hasUsedProductPromotion,
    getDeliveryAddress, saveDeliveryAddress, placeOrder, getOrders,
    getSchedule, saveSchedule, getOccupiedSlots, hasUsedPromo, createAppointment, getAppointments, updateAppointmentStatus
  };
})();
