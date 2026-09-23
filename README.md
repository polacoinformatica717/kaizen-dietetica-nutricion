# Kaizen Dietética & Nutrición

Primer prototipo funcional multipágina para una dietética con tienda online y agenda nutricional.

## Probar localmente

Servir la carpeta raíz con cualquier servidor HTTP estático. Por ejemplo:

```powershell
python -m http.server 4173
```

Abrir `http://localhost:4173`.

## Credenciales demostrativas

- Cliente: `cliente@kaizen.demo` / `Demo1234`
- Administración: `admin@kaizen.demo` / `Admin1234`

La versión actual usa `localStorage` para demostrar registro, sesión, carrito, pedidos, turnos y configuración de agenda. Antes de producción se debe reemplazar por autenticación y persistencia de servidor, conectar Mercado Pago y cargar el teléfono real de WhatsApp.
