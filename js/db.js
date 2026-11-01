/**
 * db.js - Capa de acceso a datos con IndexedDB
 * Maneja el almacenamiento offline de productos y ventas
 */

const DB = {
    DB_NAME: 'CAJAGO',
    DB_VERSION: 1,
    db: null,

    /**
     * Abre (o crea) la base de datos IndexedDB.
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(new Error('No se pudo abrir la base de datos'));

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Almacén de productos
                if (!db.objectStoreNames.contains('products')) {
                    const productStore = db.createObjectStore('products', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    productStore.createIndex('barcode', 'barcode', { unique: false });
                    productStore.createIndex('name', 'name', { unique: false });
                    productStore.createIndex('category', 'category', { unique: false });
                }

                // Almacén de ventas
                if (!db.objectStoreNames.contains('sales')) {
                    const saleStore = db.createObjectStore('sales', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    saleStore.createIndex('dateKey', 'dateKey', { unique: false });
                    saleStore.createIndex('folio', 'folio', { unique: false });
                }

                // Almacén de configuración
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    },

    /**
     * Ejecuta una transacción de lectura/escritura.
     * @param {string} storeName - Nombre del almacén
     * @param {'readonly'|'readwrite'} mode - Modo de la transacción
     * @returns {Promise<IDBObjectStore>}
     */
    _getStore(storeName, mode) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
            tx.onerror = () => reject(tx.error);
            resolve(store);
        });
    },

    /**
     * Convierte una petición IndexedDB en Promise.
     * @param {IDBRequest} request
     * @returns {Promise<any>}
     */
    _requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // ============ PRODUCTOS ============

    /**
     * Obtiene todos los productos.
     * @returns {Promise<Array>}
     */
    async getAllProducts() {
        const store = await this._getStore('products', 'readonly');
        return this._requestToPromise(store.getAll());
    },

    /**
     * Busca un producto por su código de barras.
     * @param {string} barcode - Código de barras a buscar
     * @returns {Promise<Object|null>}
     */
    async getProductByBarcode(barcode) {
        const store = await this._getStore('products', 'readonly');
        const index = store.index('barcode');
        return this._requestToPromise(index.get(barcode));
    },

    /**
     * Busca un producto por su ID.
     * @param {number} id - ID del producto
     * @returns {Promise<Object|null>}
     */
    async getProductById(id) {
        const store = await this._getStore('products', 'readonly');
        return this._requestToPromise(store.get(id));
    },

    /**
     * Agrega un nuevo producto.
     * @param {Object} product - Datos del producto
     * @returns {Promise<number>} ID generado
     */
    async addProduct(product) {
        product.createdAt = Date.now();
        product.updatedAt = Date.now();
        const store = await this._getStore('products', 'readwrite');
        return this._requestToPromise(store.add(product));
    },

    /**
     * Actualiza un producto existente.
     * @param {Object} product - Producto con ID
     * @returns {Promise<number>} ID del producto
     */
    async updateProduct(product) {
        product.updatedAt = Date.now();
        const store = await this._getStore('products', 'readwrite');
        return this._requestToPromise(store.put(product));
    },

    /**
     * Elimina un producto.
     * @param {number} id - ID del producto a eliminar
     * @returns {Promise<void>}
     */
    async deleteProduct(id) {
        const store = await this._getStore('products', 'readwrite');
        return this._requestToPromise(store.delete(id));
    },

    /**
     * Busca productos por nombre o código (para autocompletado del POS).
     * @param {string} query - Texto de búsqueda
     * @returns {Promise<Array>} Productos que coinciden
     */
    async searchProducts(query) {
        const all = await this.getAllProducts();
        const q = query.toLowerCase().trim();
        if (!q) return [];
        return all.filter(p =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.barcode && p.barcode.includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
        ).slice(0, 20);
    },

    // ============ VENTAS ============

    /**
     * Registra una nueva venta.
     * @param {Object} sale - Datos de la venta
     * @returns {Promise<number>} ID generado
     */
    async addSale(sale) {
        sale.dateKey = Utils.getDateKey(sale.timestamp);
        const store = await this._getStore('sales', 'readwrite');
        return this._requestToPromise(store.add(sale));
    },

    /**
     * Obtiene todas las ventas ordenadas por fecha descendente.
     * @returns {Promise<Array>}
     */
    async getAllSales() {
        const store = await this._getStore('sales', 'readonly');
        const all = await this._requestToPromise(store.getAll());
        return all.sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Obtiene las ventas de una fecha específica.
     * @param {string} dateKey - Fecha en formato YYYY-MM-DD
     * @returns {Promise<Array>}
     */
    async getSalesByDate(dateKey) {
        const store = await this._getStore('sales', 'readonly');
        const index = store.index('dateKey');
        return this._requestToPromise(index.getAll(dateKey));
    },

    /**
     * Obtiene una venta por su ID.
     * @param {number} id - ID de la venta
     * @returns {Promise<Object|null>}
     */
    async getSaleById(id) {
        const store = await this._getStore('sales', 'readonly');
        return this._requestToPromise(store.get(id));
    },

    /**
     * Obtiene las ventas de los últimos N días.
     * @param {number} days - Número de días hacia atrás (default 7)
     * @returns {Promise<Array>}
     */
    async getRecentSales(days = 7) {
        const all = await this.getAllSales();
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return all.filter(s => s.timestamp >= cutoff);
    },

    // ============ CONFIGURACIÓN ============

    /**
     * Obtiene un valor de configuración.
     * @param {string} key - Clave de configuración
     * @returns {Promise<any>}
     */
    async getSetting(key) {
        const store = await this._getStore('settings', 'readonly');
        const result = await this._requestToPromise(store.get(key));
        return result ? result.value : null;
    },

    /**
     * Guarda un valor de configuración.
     * @param {string} key - Clave
     * @param {any} value - Valor a guardar
     * @returns {Promise<void>}
     */
    async setSetting(key, value) {
        const store = await this._getStore('settings', 'readwrite');
        return this._requestToPromise(store.put({ key, value }));
    },

    /**
     * Carga datos de demostración (productos de ejemplo) si la base está vacía.
     * Útil para primera ejecución del sistema.
     */
    async seedDemoDataIfEmpty() {
        const products = await this.getAllProducts();
        if (products.length > 0) return;

        const demoProducts = [
            { barcode: '7501000001', name: 'Coca-Cola 600ml', category: 'Bebidas', price: 18, cost: 13, stock: 24 },
            { barcode: '7501000002', name: 'Sabritas Original 45g', category: 'Botanas', price: 16, cost: 11, stock: 30 },
            { barcode: '7501000003', name: 'Leche Lala 1L', category: 'Lácteos', price: 28, cost: 22, stock: 12 },
            { barcode: '7501000004', name: 'Pan Bimbo Grande', category: 'Panadería', price: 45, cost: 36, stock: 8 },
            { barcode: '7501000005', name: 'Detergente Ariel 1kg', category: 'Limpieza', price: 32, cost: 25, stock: 15 },
            { barcode: '7501000006', name: 'Agua Ciel 1L', category: 'Bebidas', price: 12, cost: 7, stock: 40 },
            { barcode: '7501000007', name: 'Pasta La Moderna 200g', category: 'Abarrotes', price: 14, cost: 9, stock: 3 },
            { barcode: '7501000008', name: 'Jugo Del Valle 1L', category: 'Bebidas', price: 30, cost: 23, stock: 10 },
            { barcode: '7501000009', name: 'Galletas Marías Gamesa', category: 'Botanas', price: 15, cost: 10, stock: 0 },
            { barcode: '7501000010', name: 'Jabón Zote Rosa', category: 'Limpieza', price: 22, cost: 16, stock: 18 },
        ];

        for (const p of demoProducts) {
            await this.addProduct(p);
        }
    },

    /**
     * Exporta todos los datos a un objeto JSON (para respaldo).
     * @returns {Promise<Object>}
     */
    async exportData() {
        return {
            products: await this.getAllProducts(),
            sales: await this.getAllSales(),
            exportedAt: new Date().toISOString(),
            version: this.DB_VERSION
        };
    },

    /**
     * Obtiene estadísticas de ventas del día actual.
     * @returns {Promise<Object>}
     */
    async getTodayStats() {
        const todayKey = Utils.getDateKey();
        const todaySales = await this.getSalesByDate(todayKey);
        const total = todaySales.reduce((sum, s) => sum + s.total, 0);
        return {
            count: todaySales.length,
            total: total,
            sales: todaySales
        };
    }
};
