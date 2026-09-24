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

console.log("Agenda presencial y virtual validada correctamente.");
