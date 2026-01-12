# Shop de Plumas - Sistema de Gestión

Este proyecto es un sistema de gestión integral (ERP/CRM) para el emprendimiento "Shop de Plumas", desarrollado con tecnologías web modernas y capacidad PWA (Offline First).

## 🚀 Características

*   **PWA Completa**: Instalable en móvil y escritorio, funciona sin conexión.
*   **Gestión de Inventario**: Productos, stock, alertas de stock mínimo.
*   **Punto de Venta (POS)**: Carrito, múltiples medios de pago, descuento/recargo.
*   **Multi-divisa**: Soporte para ARS y USD con congelamiento de tasa de cambio.
*   **Clientes**: Cuenta corriente, historial de compras, saldos.
*   **Reportes**: Ventas diarias, mensuales, PDFs de recibos y remitos.
*   **Offline First**: Persistencia de datos local (IndexedDB + LocalStorage) y sincronización (preparado).

## 🛠️ Tecnologías

*   **Frontend**: React, TypeScript, Vite.
*   **Estilos**: CSS Modules / Vanilla CSS.
*   **Estado**: React Context API.
*   **Persistencia**: IndexedDB (`idb`), LocalStorage.
*   **PWA**: `vite-plugin-pwa`, Workbox.
*   **PDFs**: `jspdf`, `jspdf-autotable`.
*   **Utilidades**: `date-fns`, `lucide-react`, `qrcode`.

## 📦 Instalación

1.  Clonar el repositorio:
    ```bash
    git clone <url-repo>
    cd shop-de-plumas
    ```

2.  Instalar dependencias:
    ```bash
    npm install
    ```

3.  Iniciar servidor de desarrollo:
    ```bash
    npm run dev
    ```

## 📱 PWA y Offline

La aplicación incluye un Service Worker que cachea assets y lógica de IndexedDB para datos.
*   **Instalación**: Buscar el icono de "Instalar" en la barra del navegador (Chrome/Edge) o "Agregar a Inicio" en móvil.
*   **Offline**: Al perder conexión, aparece un indicador rojo en pantalla. Las ventas se pueden seguir operando (los datos se guardan localmente).

## 🚢 Despliegue

La aplicación es estática (SPA) y compatible con Vercel, Netlify o GitHub Pages.

**Build de producción:**
```bash
npm run build
```
Esto genera la carpeta `dist` lista para subir.

## 📱 Capacitor (Android/iOS)

El proyecto está preparado para empaquetarse con Capacitor.

1.  Inicializar Capacitor (si no se ha hecho):
    ```bash
    npx cap init
    ```
2.  Construir la app web:
    ```bash
    npm run build
    ```
3.  Añadir plataformas:
    ```bash
    npm i @capacitor/android @capacitor/ios
    npx cap add android
    npx cap add ios
    ```
4.  Sincronizar:
    ```bash
    npx cap sync
    ```

## 🔐 Seguridad

*   `localStorage` se usa para sesión básica.
*   **IMPORTANTE**: No subir archivos `.env` o credenciales al repositorio.

## 🤝 Contribución

*   Rama `main`: Producción estable.
*   Rama `dev`: Desarrollo e integración.

---
**Shop de Plumas by Lila**
