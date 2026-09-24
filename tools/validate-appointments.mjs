import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const storage = new Map();
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); },
};
const window = { localStorage, dispatchEvent() {}, crypto: globalThis.crypto };
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
await window.KaizenStore.login("admin@kaizen.demo", "Admin1234");
window.KaizenStore.saveSchedule({
  mode: "auto",
  presential: { weekdays: [1], times: ["09:00", "09:20", "10:00", "15:00"] },
  virtual: { weekdays: [1], times: ["15:00", "15:20", "16:00"] },
});
window.KaizenStore.logout();
await window.KaizenStore.login("cliente@kaizen.demo", "Demo1234");

const schedule = window.KaizenStore.getSchedule();
assert.deepEqual([...schedule.presential.weekdays], [1]);
assert.deepEqual([...schedule.virtual.weekdays], [1]);

const date = "2026-09-28";
const initial = window.KaizenStore.createAppointment({ type: "Consulta inicial", modality: "Presencial", date, time: "09:00" });
assert.equal(initial.durationMinutes, 40);
assert.equal(initial.modality, "Presencial");
assert.deepEqual([...window.KaizenStore.getOccupiedSlots(date, "Presencial", "Control nutricional")], ["09:00", "09:20"]);

const control = window.KaizenStore.createAppointment({ type: "Control nutricional", modality: "Virtual", date, time: "15:00" });
assert.equal(control.durationMinutes, 20);
assert.equal(control.modality, "Virtual");
assert.throws(() => window.KaizenStore.createAppointment({ type: "Control nutricional", modality: "Presencial", date, time: "15:00" }), /ocuparse/);
assert.throws(() => window.KaizenStore.createAppointment({ type: "Control nutricional", modality: "Virtual", date, time: "09:20" }), /no está disponible/);

const followupConflict = window.KaizenStore.createAppointment({ type: "Control nutricional", modality: "Presencial", date: "2026-10-05", time: "10:00" });
const countBeforeFailedPromotion = window.KaizenStore.getAppointments().length;
assert.throws(() => window.KaizenStore.createAppointment({ type: "Consulta inicial + 2 Controles", modality: "Presencial", date, time: "10:00" }), /control del 2026-10-05/);
assert.equal(window.KaizenStore.getAppointments().length, countBeforeFailedPromotion, "Una promoción sin disponibilidad completa no debe crear turnos parciales");
assert.equal(window.KaizenStore.hasUsedPromo(), false);
window.KaizenStore.logout();
await window.KaizenStore.login("admin@kaizen.demo", "Admin1234");
window.KaizenStore.updateAppointmentStatus(followupConflict.id, "Cancelado");
window.KaizenStore.logout();
await window.KaizenStore.login("cliente@kaizen.demo", "Demo1234");

const promotion = window.KaizenStore.createAppointment({ type: "Consulta inicial + 2 Controles", modality: "Presencial", date, time: "10:00" });
assert.equal(promotion.bundleAppointments.length, 3);
assert.deepEqual([...promotion.bundleAppointments.map((item) => item.date)], ["2026-09-28", "2026-10-05", "2026-10-12"]);
assert.deepEqual([...promotion.bundleAppointments.map((item) => item.durationMinutes)], [40, 20, 20]);
assert.equal(new Set(promotion.bundleAppointments.map((item) => item.seriesId)).size, 1);
assert.equal(window.KaizenStore.hasUsedPromo(), true);
assert.throws(() => window.KaizenStore.createAppointment({ type: "Consulta inicial + 2 Controles", modality: "Virtual", date, time: "16:00" }), /único uso/);
assert.throws(() => window.KaizenStore.createAppointment({ type: "Control nutricional", modality: "Virtual", date: "2026-10-05", time: "10:00" }), /no está disponible/);
assert.ok(window.KaizenStore.getOccupiedSlots(date, "Presencial", "Consulta inicial + 2 Controles").includes("10:00"));

console.log("Agenda presencial, virtual y promoción de tres turnos validadas correctamente.");
