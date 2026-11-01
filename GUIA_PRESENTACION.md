# Guía para Presentación de CAJAGO
## Sistema de Punto de Venta para Tiendas de Abarrotes

> Este documento es una guía completa para las personas que van a presentar el sistema CAJAGO. Incluye qué hace el programa, ejemplos con clientes reales y las instrucciones paso a paso de cómo se usa.

---

## 1. ¿Qué es CAJAGO?

CAJAGO es un sistema de punto de venta (POS) diseñado específicamente para tiendas de abarrotes. Permite a los dueños de tienda:

- **Registrar todos sus productos** con código de barras, nombre, precio y existencias
- **Cobrar a los clientes** escaneando el código de barras del producto o buscándolo por nombre
- **Calcular automáticamente** el total de la compra y el cambio a devolver
- **Llevar el control del inventario** (cuántos productos quedan de cada uno)
- **Ver el historial de ventas** de cada día
- **Consultar estadísticas** como cuánto se vendió hoy, qué productos se acaban y cuáles se venden más

**Lo innovador del sistema:**
- Funciona en cualquier dispositivo: celular, tablet, laptop o computadora de escritorio
- No necesita internet para funcionar (los datos se guardan en el mismo dispositivo)
- Se puede escanear el código de barras con la cámara del celular o tablet (no necesita comprar un escáner aparte)
- También es compatible con escáneres USB que se conectan a la computadora
- Interfaz en español, con botones grandes y diseño fácil de entender

---

## 2. Estructura del Sistema

El sistema tiene 4 secciones principales a las que se accede desde el menú lateral izquierdo:

### 📊 Panel
Muestra un resumen general de la tienda:
- Ventas del día (dinero total)
- Número de productos registrados
- Transacciones realizadas hoy
- Alertas de inventario bajo (productos que se están acabando)
- Productos más vendidos
- Gráfica de ventas de los últimos 7 días

### 🛍️ Cobrar (Punto de Venta)
La pantalla principal donde se cobra al cliente. Se busca el producto por nombre o se escanea su código de barras, se agrega al carrito, se ingresa el dinero que dio el cliente y el sistema calcula el cambio.

### 📦 Productos (Inventario)
Aquí se registran, editan y eliminan los productos de la tienda. Cada producto tiene: código de barras, nombre, categoría, precio de venta, costo de compra y existencias.

### 🧾 Ventas (Historial)
Lista de todas las ventas realizadas. Se puede ver el detalle de cada venta (qué productos se vendieron, cuánto se cobró, qué cambio se dio) y filtrar por fecha.

---

## 3. Ejemplos Prácticos para la Presentación

A continuación se presentan ejemplos de situaciones reales que pueden usar para demostrar el sistema durante la presentación.

---

### Ejemplo 1: Doña María viene a comprar despensa

**Situación:** Doña María llega a la tienda de don Carlos y pide varios productos de uso diario.

**Productos que lleva:**
- 2 Coca-Colas de 600ml ($18.00 c/u)
- 1 pan Bimbo grande ($45.00)
- 3 jugos Del Valle de 1L ($30.00 c/u)
- 1 jabón Zote ($22.00)

**Cómo se cobra paso a paso:**

1. El dueño abre la sección **Cobrar** (presionar F1 o clic en "🛍️ Cobrar" en el menú).

2. Para cada producto, hay dos opciones:
   - **Opción A (escaneo):** Si tiene un escáner USB conectado, simplemente escanea el código de barras de cada producto y se agrega automáticamente al carrito.
   - **Opción B (búsqueda):** Escribe "coca" en la barra de búsqueda y aparece la Coca-Cola. Hace clic en el resultado. Repite para "pan bimbo", "jugo" y "jabón".

3. Para las 2 Coca-Colas y los 3 jugos, ajusta la cantidad:
   - Hace clic en el botón **+** al lado del producto en el carrito para aumentar la cantidad.

4. El sistema muestra automáticamente:
   - Total de artículos: 7
   - Subtotal: $181.00
   - **Total a pagar: $181.00**

5. Doña María paga con un billete de $200. El dueño escribe "200" en el campo **Efectivo recibido** (o presiona el botón rápido **$200**).

6. El sistema muestra: **Cambio: $19.00**

7. El dueño presiona el botón **💵 Cobrar**.

8. Aparece un recibo en pantalla con el detalle de la compra:
   ```
   🛒 CAJAGO
   01/11/2026 15:30
   Folio: V3A2B1C

   2x Coca-Cola 600ml          $36.00
   1x Pan Bimbo Grande          $45.00
   3x Jugo Del Valle 1L         $90.00
   1x Jabón Zote Rosa           $22.00
   ──────────────────────
   TOTAL                       $181.00
   Efectivo                    $200.00
   Cambio                       $19.00
   ──────────────────────
   ¡Gracias por su compra!
   ```

9. Si quiere, puede presionar **🖨️ Imprimir** para imprimir el recibo.

10. El inventario se descuenta automáticamente (quedan 2 Coca-Colas menos, 1 pan menos, 3 jugos menos, 1 jabón menos).

---

### Ejemplo 2: El joven compra una sola cosa y paga exacto

**Situación:** Un joven llega por una bolsa de Sabritas y paga con dinero exacto.

**Paso a paso:**

1. Abrir **Cobrar**.
2. Escribir "sabritas" en la barra de búsqueda.
3. Hacer clic en "Sabritas Original 45g" de los resultados. Se agrega al carrito.
4. Total: $16.00
5. Presionar el botón **Exacto** (llena automáticamente el campo con el total exacto).
6. Presionar **💵 Cobrar**.
7. Recibo generado, inventario actualizado.

---

### Ejemplo 3: Un cliente quiere saber si hay cambio de algo que no se vendió

**Situación:** Un cliente pagó con un billete grande y el dueño necesita ver si la venta quedó registrada correctamente.

**Paso a paso:**

1. Abrir la sección **Ventas** (presionar F4 o clic en "🧾 Ventas").
2. Aparece la lista de todas las ventas, la más reciente hasta arriba.
3. Hacer clic en **👁️ Ver** en la venta que se quiere revisar.
4. Aparece el detalle completo: folio, fecha, productos, cantidades, precios, subtotal, total, efectivo recibido y cambio.
5. Cerrar con la **✕** o presionar **Esc**.

---

### Ejemplo 4: El dueño registra un producto nuevo que acaba de llegar de proveedor

**Situación:** Don Carlos recibió mercancía nueva y necesita registrar un producto que no tenía en el sistema.

**Paso a paso:**

1. Abrir la sección **Productos** (presionar F2 o clic en "📦 Productos").
2. Presionar el botón **＋ Nuevo producto**.
3. Llenar los datos:
   - **Código de barras:** Escanear el código con el botón 📷 (cámara) o escribirlo manualmente. Si no tiene código, dejar vacío y el sistema genera uno automático.
   - **Nombre del producto:** "Aceite 1-2-3 1L"
   - **Categoría:** Seleccionar "Abarrotes" del menú desplegable.
   - **Existencias:** 12
   - **Precio de venta:** 45.00
   - **Costo de compra:** 38.00 (opcional, sirve para saber la ganancia)
4. Presionar **Guardar producto**.
5. El producto aparece en la tabla de inventario y ya está disponible para cobrar.

---

### Ejemplo 5: Se está acabando un producto y el sistema avisa

**Situación:** La pasta La Moderna solo tiene 3 piezas y el sistema lo marca como inventario bajo.

**Paso a paso:**

1. Abrir el **Panel** (presionar F3 o clic en "📊 Panel").
2. En la tarjeta naranja de **Inventario bajo** aparece el número de productos con stock bajo.
3. En la sección **Productos con inventario bajo** se lista cada producto con su cantidad restante, marcado con una etiqueta:
   - Etiqueta **naranja** = inventario bajo (5 o menos)
   - Etiqueta **roja** = agotado (0 piezas)
4. El dueño sabe que debe pedir más mercancía de esos productos a su proveedor.

---

### Ejemplo 6: Edición de un producto (cambio de precio)

**Situación:** El proveedor subió el precio y don Carlos necesita actualizarlo en el sistema.

**Paso a paso:**

1. Abrir **Productos**.
2. Buscar el producto escribiendo su nombre en la barra de búsqueda.
3. Hacer clic en el botón **✏️ Editar** de ese producto.
4. Cambiar el precio en el campo **Precio de venta**.
5. Presionar **Guardar producto**.
6. El precio se actualiza y a partir de ahora las ventas usan el nuevo precio.

---

### Ejemplo 7: Eliminar un producto que ya no se vende

**Situación:** Don Carlos ya no vende un producto y quiere quitarlo del sistema.

**Paso a paso:**

1. Abrir **Productos**.
2. Buscar el producto.
3. Hacer clic en el botón **🗑️** (basura).
4. Aparece un mensaje de confirmación: "¿Eliminar [nombre] del inventario? Esta acción no se puede deshacer."
5. Presionar **Aceptar**.
6. El producto se elimina del sistema.

---

### Ejemplo 8: Consultar cuánto se vendió en un día específico

**Situación:** Don Carlos quiere saber cuánto vendió el viernes pasado.

**Paso a paso:**

1. Abrir **Ventas**.
2. En el campo de fecha, seleccionar el día que se quiere consultar (ej: 30/10/2026).
3. La tabla se filtra y solo muestra las ventas de ese día.
4. Para ver todas las ventas de nuevo, presionar el botón **Todas**.

---

## 4. Instrucciones de Uso del Sistema

### Requisitos técnicos
- Un dispositivo con navegador web (Chrome, Edge, Firefox o Safari)
- No requiere instalación de ningún programa
- No requiere internet (excepto para el escaneo con cámara, que necesita conexión segura HTTPS)

### Cómo iniciar el sistema

**En computadora (sin cámara):**
- Abrir el archivo `index.html` con doble clic en el navegador.

**Con cámara funcional (celular, tablet o computadora con webcam):**
- Necesita servirse desde una dirección HTTPS (publicado en internet) o desde localhost.
- Para pruebas locales: ejecutar un servidor en la computadora y abrir `http://localhost:8080`.
- Para uso real: publicar en un servicio como Netlify o GitHub Pages para tener una URL con HTTPS.

### Primera vez usando el sistema
1. Al abrir por primera vez, el sistema carga automáticamente 10 productos de ejemplo (Coca-Cola, Sabritas, leche, pan, detergente, etc.) para que se pueda probar de inmediato.
2. Estos productos se pueden editar o eliminar para reemplazarlos por los productos reales de la tienda.

### Registro de productos (lo primero que debe hacer un cliente nuevo)
1. Ir a **Productos**.
2. Presionar **＋ Nuevo producto**.
3. Llenar los datos del producto (nombre, precio, existencias, etc.).
4. Presionar **Guardar**.
5. Repetir con cada producto de la tienda.

> Recomendación: Sugerir al dueño que registre sus productos más vendidos primero para poder empezar a cobrar cuanto antes.

### Día a día en la tienda
1. Llega un cliente con productos.
2. Abrir **Cobrar** (F1).
3. Escanear o buscar cada producto.
4. Ajustar cantidades si lleva más de uno del mismo artículo.
5. Verificar el total.
6. Ingresar el efectivo que dio el cliente.
7. Ver el cambio calculado.
8. Presionar **Cobrar**.
9. Dar el cambio y el recibo al cliente (opcional imprimirlo).
10. El inventario se actualiza solo.

### Al final del día
1. Abrir el **Panel** (F3) para ver cuánto se vendió.
2. Revisar si hay alertas de inventario bajo.
3. Si hay productos agotados, anotarlos para pedirlos al proveedor.

---

## 5. Atajos de Teclado (para computadora)

| Tecla | Acción |
|-------|--------|
| F1 | Ir a Cobrar |
| F2 | Ir a Productos |
| F3 | Ir al Panel |
| F4 | Ir a Ventas |
| Esc | Cerrar ventanas emergentes |

---

## 6. Preguntas Frecuentes que pueden hacer en la presentación

**¿Necesito internet para usarlo?**
No. El sistema funciona sin internet porque guarda la información en el mismo dispositivo. Solo necesita internet la primera vez que carga la página, y para el escaneo con cámara (que requiere HTTPS).

**¿Qué pasa si se apaga la computadora, se pierden los datos?**
No. Los datos quedan guardados en el navegador. Al volver a abrir el sistema, todo sigue ahí.

**¿Puedo usar mi celular para cobrar?**
Sí. El sistema funciona en celular, tablet y computadora. En celular se puede escanear códigos de barras con la cámara del propio teléfono.

**¿Qué pasa si un producto no tiene código de barras?**
Se puede buscar por nombre en la pantalla de cobro. También se puede dejar el campo de código de barras vacío al registrar el producto y el sistema genera un código automático.

**¿Puedo imprimir el recibo?**
Sí. Al terminar una venta aparece un botón de imprimir que usa la impresora conectada al dispositivo.

**¿Cuántos productos puedo registrar?**
No hay límite. Se pueden registrar miles de productos.

**¿El sistema lleva la contabilidad?**
El sistema lleva el registro de ventas y el control de inventario. Muestra las ganancias si se registra el costo de compra de cada producto. No es un sistema de contabilidad completo, pero da la información clave que un dueño de abarrotes necesita.

---

## 7. Tips para la Presentación

1. **Empieza por el Panel** para mostrar el resumen general y que vean que el sistema ya tiene datos cargados.

2. **Demuestra el cobro** con el Ejemplo 1 (la compra de Doña María). Es el escenario más completo y muestra el valor principal del sistema.

3. **Muestra el inventario bajo** para destacar que el sistema ayuda a no quedarse sin mercancía.

4. **Registra un producto nuevo** en vivo para que vean qué tan fácil es.

5. **Termina mostrando el historial de ventas** y el detalle de la venta que se acaba de hacer en la demostración.

6. Si tienen escáner USB a la mano, **demuéstrenlo en vivo**. Escanea un producto real y se agrega solo al carrito. Es el momento "wow" de la presentación.

7. Si presentan desde un celular o tablet, **usen la cámara para escanear** un código de barras de un producto real. También es muy impactante.
