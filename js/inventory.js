/**
 * inventory.js - Gestión del inventario de productos
 * CRUD de productos, búsqueda y renderizado de tabla
 */

const Inventory = {
    products: [],
    filteredProducts: [],

    /**
     * Inicializa el módulo de inventario.
     */
    async init() {
        this.bindEvents();
        await this.load();
    },

    /**
     * Vincula los eventos de la interfaz de inventario.
     */
    bindEvents() {
        // Botón nuevo producto
        document.getElementById('btn-add-product').addEventListener('click', () => {
            this.openProductModal();
        });

        // Búsqueda en inventario
        document.getElementById('inventory-search').addEventListener('input',
            Utils.debounce((e) => this.search(e.target.value), 250)
        );

        // Formulario de producto
        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Cerrar modal de producto
        document.getElementById('btn-close-product-modal').addEventListener('click', () => {
            this.closeProductModal();
        });
        document.getElementById('btn-cancel-product').addEventListener('click', () => {
            this.closeProductModal();
        });

        // Escanear código de barras desde el formulario de producto
        document.getElementById('btn-scan-barcode').addEventListener('click', () => {
            BarcodeUI.openForForm();
        });

        // Mostrar/ocultar campos de peso al cambiar el checkbox
        document.getElementById('product-sold-by-weight').addEventListener('change', () => {
            this._toggleWeightFields();
        });
    },

    /**
     * Carga todos los productos desde la base de datos.
     */
    async load() {
        this.products = await DB.getAllProducts();
        this.filteredProducts = [...this.products];
        this.renderTable();
    },

    /**
     * Filtra productos por texto de búsqueda.
     * @param {string} query
     */
    search(query) {
        const q = query.toLowerCase().trim();
        if (!q) {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(p =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.barcode && p.barcode.includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q))
            );
        }
        this.renderTable();
    },

    /**
     * Renderiza la tabla de productos.
     */
    renderTable() {
        const tbody = document.getElementById('inventory-body');
        const empty = document.getElementById('inventory-empty');
        const table = document.getElementById('inventory-table');

        if (this.filteredProducts.length === 0) {
            tbody.innerHTML = '';
            empty.classList.remove('hidden');
            empty.textContent = this.products.length === 0
                ? 'No hay productos registrados. Agrega tu primer producto.'
                : 'No se encontraron productos con esa búsqueda.';
            table.style.display = 'none';
            return;
        }

        empty.classList.add('hidden');
        table.style.display = '';

        tbody.innerHTML = this.filteredProducts.map(p => {
            const status = Utils.getStockStatus(p.stock);
            const stockLabel = p.soldByWeight
                ? `${p.stock} ${p.unit || 'kg'}`
                : `${p.stock} pza`;
            const priceLabel = p.soldByWeight
                ? `${Utils.formatCurrency(p.price)}/kg`
                : Utils.formatCurrency(p.price);
            return `
                <tr>
                    <td><code>${Utils.escapeHtml(p.barcode || '—')}</code></td>
                    <td>
                        ${Utils.escapeHtml(p.name)}
                        ${p.soldByWeight ? '<span class="badge badge-weight">⚖️ Peso</span>' : ''}
                    </td>
                    <td><span class="badge badge-success">${Utils.escapeHtml(p.category || 'General')}</span></td>
                    <td><strong>${priceLabel}</strong></td>
                    <td>
                        <span class="stock-cell ${status.class}">
                            ${stockLabel}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-edit" onclick="Inventory.editProduct('${p.id}')">✏️ Editar</button>
                            <button class="btn btn-delete" onclick="Inventory.confirmDelete('${p.id}')">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Abre el modal de producto (nuevo o edición).
     * @param {Object|null} product - Producto a editar, o null para nuevo
     */
    openProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');

        if (product) {
            title.textContent = 'Editar producto';
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-barcode').value = product.barcode || '';
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-category').value = product.category || 'General';
            document.getElementById('product-stock').value = product.stock || 0;
            document.getElementById('product-price').value = product.price || '';
            document.getElementById('product-cost').value = product.cost || '';
            document.getElementById('product-sold-by-weight').checked = !!product.soldByWeight;
            document.getElementById('product-unit').value = product.unit || 'kg';
        } else {
            title.textContent = 'Nuevo producto';
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
            document.getElementById('product-sold-by-weight').checked = false;
            document.getElementById('product-unit').value = 'kg';
        }

        // Mostrar/ocultar selector de unidad según el checkbox
        this._toggleWeightFields();
        modal.classList.remove('hidden');
    },

    /**
     * Muestra u oculta la sección de unidad de peso según el checkbox.
     */
    _toggleWeightFields() {
        const soldByWeight = document.getElementById('product-sold-by-weight').checked;
        const weightSection = document.getElementById('weight-unit-section');
        const stockLabel = document.getElementById('stock-label');
        const priceLabel = document.getElementById('price-label');

        if (soldByWeight) {
            weightSection.classList.remove('hidden');
            stockLabel.textContent = 'Existencias (en la unidad seleccionada)';
            priceLabel.textContent = 'Precio de venta por kg ($) *';
        } else {
            weightSection.classList.add('hidden');
            stockLabel.textContent = 'Existencias';
            priceLabel.textContent = 'Precio de venta ($) *';
        }
    },

    /**
     * Cierra el modal de producto.
     */
    closeProductModal() {
        document.getElementById('product-modal').classList.add('hidden');
    },

    /**
     * Guarda un producto (nuevo o editado).
     */
    async saveProduct() {
        const id = document.getElementById('product-id').value;
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const soldByWeight = document.getElementById('product-sold-by-weight').checked;
        const unit = soldByWeight
            ? document.getElementById('product-unit').value
            : 'pza';
        // Stock: decimal para productos por peso, entero para piezas
        const stock = soldByWeight
            ? (parseFloat(document.getElementById('product-stock').value) || 0)
            : (parseInt(document.getElementById('product-stock').value) || 0);
        const cost = parseFloat(document.getElementById('product-cost').value) || 0;

        // Validaciones
        if (!name) {
            Utils.toast('El nombre del producto es obligatorio', 'error');
            return;
        }
        if (!Utils.isPositiveNumber(price) || price <= 0) {
            Utils.toast('El precio debe ser mayor a 0', 'error');
            return;
        }

        let barcode = document.getElementById('product-barcode').value.trim();
        if (!barcode) {
            barcode = Utils.generateBarcode();
        }

        // Verificar código de barras duplicado
        const existing = await DB.getProductByBarcode(barcode);
        if (existing && existing.id != id) {
            Utils.toast('Ya existe un producto con ese código de barras', 'error');
            return;
        }

        const product = {
            barcode,
            name,
            category: document.getElementById('product-category').value,
            price,
            stock,
            cost,
            soldByWeight,
            unit
        };

        if (id) {
            product.id = id; // Firestore usa strings como ID
            await DB.updateProduct(product);
            Utils.toast('Producto actualizado correctamente', 'success');
        } else {
            await DB.addProduct(product);
            Utils.toast('Producto agregado correctamente', 'success');
        }

        this.closeProductModal();
        await this.load();

        // Actualizar el dashboard si está visible
        if (Dashboard.refresh) Dashboard.refresh();
    },

    /**
     * Abre el modal para editar un producto.
     * @param {number} id - ID del producto
     */
    async editProduct(id) {
        const product = await DB.getProductById(id);
        if (product) {
            this.openProductModal(product);
        }
    },

    /**
     * Confirma y elimina un producto.
     * @param {number} id - ID del producto
     */
    async confirmDelete(id) {
        const product = await DB.getProductById(id);
        if (!product) return;

        if (confirm(`¿Eliminar "${product.name}" del inventario?\nEsta acción no se puede deshacer.`)) {
            await DB.deleteProduct(id);
            Utils.toast('Producto eliminado', 'success');
            await this.load();
            if (Dashboard.refresh) Dashboard.refresh();
        }
    },

    /**
     * Rellena el campo de código de barras en el formulario
     * tras escanear con la cámara.
     * @param {string} code - Código escaneado
     */
    fillBarcodeField(code) {
        const field = document.getElementById('product-barcode');
        if (field) {
            field.value = code;
            Utils.toast('Código escaneado: ' + code, 'success');
        }
    }
};

/**
 * Manejador de la interfaz de escaneo con cámara.
 * Centraliza la apertura/cierre del modal de cámara
 * para usarlo desde diferentes contextos (POS, inventario).
 */
const BarcodeUI = {
    onDetectCallback: null,

    /**
     * Abre la cámara para escanear y alimentar el formulario de producto.
     */
    openForForm() {
        this.open((code) => {
            Inventory.fillBarcodeField(code);
        });
    },

    /**
     * Abre la cámara para escanear y alimentar el punto de venta.
     */
    openForPOS() {
        this.open((code) => {
            POS.handleScan(code);
        });
    },

    /**
     * Abre el modal de cámara y configura el callback.
     * @param {Function} callback - Se ejecuta al detectar un código
     */
    open(callback) {
        if (!Barcode.isCameraSupported()) {
            Utils.toast('Tu dispositivo no soporta escaneo con cámara', 'error');
            return;
        }

        this.onDetectCallback = callback;
        const modal = document.getElementById('camera-modal');
        modal.classList.remove('hidden');

        const video = document.getElementById('camera-video');
        Barcode.startCamera(video, (code) => {
            // Detectar una sola vez y cerrar
            this.close();
            if (this.onDetectCallback) {
                this.onDetectCallback(code);
            }
        }, (error) => {
            Utils.toast('No se pudo acceder a la cámara. Verifica los permisos.', 'error');
            this.close();
        });
    },

    /**
     * Cierra el modal de cámara.
     */
    close() {
        document.getElementById('camera-modal').classList.add('hidden');
        Barcode.stopCamera();
    },

    /**
     * Inicializa los eventos del modal de cámara.
     */
    init() {
        document.getElementById('btn-close-camera').addEventListener('click', () => {
            this.close();
        });
    }
};
