import { cp, mkdir, rm } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const root = resolve(process.cwd());
const output = resolve(root, "dist");
if (basename(output) !== "dist" || !output.startsWith(root)) throw new Error("Ruta de salida no válida");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const directory of ["assets", "css", "js"]) await cp(join(root, directory), join(output, directory), { recursive: true });
for (const file of ["index.html", "tienda.html", "carrito.html", "nutricion.html", "acceso.html", "cuenta.html"]) await cp(join(root, file), join(output, file));
console.log("Sitio estático preparado en dist/");
