# 🛒 CAJAGO - Sistema de Punto de Venta para Tiendas de Abarrotes

Sistema de cobro e inventario diseñado para tiendas de abarrotes. Permite registrar productos, escanear códigos de barras, cobrar ventas y llevar control del inventario. Funciona sin conexión a internet.

## ✅ Características

- **Punto de venta (Cobrar)**: Escanea o busca productos, arma el carrito, calcula el total y el cambio automáticamente.
- **Escaneo de código de barras**: Compatible con escáner USB y con la cámara del dispositivo (celular, tablet o laptop).
- **Inventario**: Registra productos con código de barras, nombre, categoría, precio, costo y existencias.
- **Historial de ventas**: Consulta todas las ventas con su detalle, filtra por fecha.
- **Panel de control**: Estadísticas de ventas del día, alertas de inventario bajo, productos más vendidos y gráfica de la semana.
- **Sin internet**: Todos los datos se guardan en el dispositivo. No requiere conexión.
- **Recibos imprimibles**: Genera un recibo para cada venta listo para imprimir.

## 🚀 Cómo usarlo

### Requisitos
- Navegador web moderno (Chrome, Edge, Firefox, Safari)
- No requiere instalación

### Pasos
1. Abre el archivo `index.html` en el navegador (doble clic).
2. En la primera apertura, se cargan 10 productos de ejemplo para que pruebes el sistema.
3. Ve a la sección **Productos** para agregar, editar o eliminar tus productos reales.
4. Ve a **Cobrar** para registrar una venta: escribe el nombre del producto, escanea el código, o usa el botón de cámara.
5. Ingresa el efectivo recibido y el sistema calcula el cambio. Presiona **Cobrar**.
6. Consulta el **Panel** para ver tus estadísticas y el **Historial** para ver todas las ventas.

## ⌨️ Atajos de teclado

| Tecla | Acción |
|-------|--------|
| F1 | Ir a Cobrar |
| F2 | Ir a Productos |
| F3 | Ir al Panel |
| F4 | Ir a Ventas |
| Esc | Cerrar ventanas emergentes |
| Enter (en Cobrar) | Buscar producto por código de barras |

## 📷 Escaneo de código de barras

**Con escáner USB**: Conecta el escáner a la computadora. Simplemente asegúrate de estar en la pantalla de Cobrar y escanea el producto; se agregará automáticamente al carrito.

**Con cámara**: Presiona el botón "Cámara" en la pantalla de Cobrar. Permite el acceso a la cámara y enfoca el código de barras dentro del recuadro. Funca en celular, tablet y computadora con webcam.

> **Nota sobre la cámara**: El escaneo con cámara requiere que la página se abra desde una conexión segura (HTTPS) o desde `localhost`. Si abres el archivo directamente (`file://`), el navegador podría bloquear el acceso a la cámara. Para usar la cámara en un equipo de escritorio, sirve el proyecto con un servidor local simple:
> ```bash
> # Con Python instalado:
> python -m http.server 8080
> # Luego abre http://localhost:8080 en el navegador
> ```
> El escáner USB funciona sin importar cómo abras el archivo.

## 🗂️ Estructura del proyecto

```
Cobro de tienda/
├── index.html          # Página principal (interfaz completa)
├── css/
│   └── styles.css      # Estilos visuales
├── js/
│   ├── app.js          # Inicialización y navegación
│   ├── db.js           # Base de datos (IndexedDB, offline)
│   ├── utils.js        # Funciones de formato y helpers
│   ├── barcode.js      # Escaneo USB y de cámara
│   ├── inventory.js    # Gestión de productos
│   ├── pos.js          # Punto de venta (cobro)
│   ├── sales.js        # Historial de ventas
│   └── dashboard.js    # Panel de control con estadísticas
└── README.md           # Este archivo
```

## 💾 Almacenamiento de datos

Los datos se guardan localmente en el navegador usando IndexedDB. Esto significa:
- No se necesita servidor ni conexión a internet.
- La información permanece guardada aunque cierres el navegador.
- Para respaldar: usa la consola del navegador y ejecuta `DB.exportData()`.
- Al limpiar los datos del navegador se perderá la información (considera exportar respaldos periódicamente).

## 📌 Notas

- El sistema incluye 10 productos de demostración en la primera apertura. Puedes editarlos o eliminarlos.
- El campo de costo de compra es opcional pero te ayuda a conocer tu ganancia.
- Se considera "inventario bajo" cuando un producto tiene 5 o menos existencias.
- Los recibos se imprimen en formato compacto para impresoras térmicas o normales.

## 📄 Licencia

Proyecto propietario para venta a tiendas de abarrotes.
