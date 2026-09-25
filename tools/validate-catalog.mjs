import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const storage = new Map([["kaizen_cart_v1", JSON.stringify([{ id: 1, quantity: 3 }])]]);
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); },
};

const window = {
  localStorage,
  dispatchEvent() {},
  crypto: globalThis.crypto,
};

const context = vm.createContext({
  window,
  localStorage,
  CustomEvent: class CustomEvent { constructor(type) { this.type = type; } },
  TextEncoder,
  btoa: (value) => Buffer.from(value, "binary").toString("base64"),
  unescape,
  encodeURIComponent,
  console,
  Date,
});

for (const file of ["../js/data.js", "../js/store.js"]) {
  vm.runInContext(fs.readFileSync(new URL(file, import.meta.url), "utf8"), context, { filename: file });
}

await window.KaizenStore.initialize();

const products = window.KAIZEN_PRODUCTS;
assert.equal(window.KAIZEN_CATEGORIES.length, 16);
assert.equal(products.length, 2094);
assert.equal(new Set(products.map((product) => product.id)).size, products.length);
assert.equal(new Set(products.map((product) => product.article)).size, products.length);
assert.equal(products.filter((product) => product.priceStatus === "consult" && product.price === 0).length, 196);
assert.equal(products.filter((product) => product.isPromotion).length, 804);
assert.equal(new Set(products.map((product) => product.article.replace(/-V\d+$/i, ""))).size, 428);
assert.equal(storage.has("kaizen_cart_v1"), false);
assert.equal(window.KaizenStore.getCartSummary().quantity, 0);

const consultProduct = products.find((product) => product.priceStatus === "consult");
assert.throws(() => window.KaizenStore.addToCart(consultProduct.id), /consultar el precio/);

const promotion = products.find((product) => product.isPromotion && product.price > 0 && product.promotionMinimumQuantity > 1);
assert.throws(() => window.KaizenStore.addToCart(promotion.id), /Iniciá sesión/);

const customer = { id: "test-customer", role: "customer", name: "Cliente Prueba", email: "cliente@example.com", phone: "000000", locality: "Prueba" };
localStorage.setItem("kaizen_session_v1", JSON.stringify(customer));
window.KaizenStore.addToCart(promotion.id);
let cart = window.KaizenStore.getCartSummary();
assert.equal(cart.lines[0].quantity, promotion.promotionMinimumQuantity);

window.KaizenStore.placeOrder({ payment: "whatsapp", delivery: "pickup" });
assert.equal(window.KaizenStore.hasUsedProductPromotion(promotion.id), true);
assert.throws(() => window.KaizenStore.addToCart(promotion.id), /ya fue utilizada/);

localStorage.setItem("kaizen_session_v1", JSON.stringify({ id: "usr-admin", role: "admin", name: "Equipo Kaizen", email: "admin@kaizen.demo" }));
const created = window.KaizenStore.saveCatalogProduct({
  name: "Producto de prueba",
  article: "TEST-001",
  category: "FRUTOS SECOS",
  unit: "250 g",
  price: 2500,
  stock: 2,
  image: "data:image/png;base64,AA==",
  condition: "Precio por paquete",
  description: "Producto creado para validar la administración del catálogo."
});
assert.equal(window.KaizenStore.getCatalogProducts().length, 2095);
assert.equal(created.stock, 2);
assert.equal(created.image, "data:image/png;base64,AA==");
const edited = window.KaizenStore.saveCatalogProduct({ ...created, price: 2800, stock: 3, image: "frutos-secos.jpeg" });
assert.equal(edited.price, 2800);
assert.equal(edited.stock, 3);
assert.equal(edited.image, "frutos-secos.jpeg");
assert.throws(() => window.KaizenStore.saveCatalogProduct({ ...edited, image: "javascript:alert(1)" }), /formato válido/);

localStorage.setItem("kaizen_session_v1", JSON.stringify(customer));
assert.throws(() => window.KaizenStore.addToCart(created.id, 4), /Solo quedan 3 unidades/);
window.KaizenStore.addToCart(created.id, 2);
window.KaizenStore.placeOrder({ payment: "whatsapp", delivery: "pickup" });
assert.equal(window.KaizenStore.getCatalogProducts().find((product) => product.id === created.id).stock, 1);

localStorage.setItem("kaizen_session_v1", JSON.stringify({ id: "usr-admin", role: "admin", name: "Equipo Kaizen", email: "admin@kaizen.demo" }));
window.KaizenStore.removeCatalogProduct(created.id);
assert.equal(window.KaizenStore.getCatalogProducts().some((product) => product.id === created.id), false);

console.log("Catálogo agrupado, stock y administración validados correctamente.");
