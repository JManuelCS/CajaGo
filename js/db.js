/**
 * db.js - Capa de acceso a datos con Firebase Firestore
 * Los datos se sincronizan automáticamente entre todos los dispositivos
 */

const DB = {
    DB_VERSION: 2,

    // Referencia a las colecciones de Firestore
    _col: {
        products: null,
        sales: null,
        settings: null,
    },

    /**
     * Inicializa la conexión con Firebase Firestore.
     * @returns {Promise<void>}
     */
    async init() {
        // firebase y firestore ya están disponibles como globales desde index.html
        const db = firebase.firestore();
        this._col.products = db.collection('products');
        this._col.sales    = db.collection('sales');
        this._col.settings = db.collection('settings');
    },

    // ============ PRODUCTOS ============

    /**
     * Obtiene todos los productos.
     * @returns {Promise<Array>}
     */
    async getAllProducts() {
        const snap = await this._col.products.orderBy('name').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /**
     * Busca un producto por su código de barras.
     * @param {string} barcode
     * @returns {Promise<Object|null>}
     */
    async getProductByBarcode(barcode) {
        const snap = await this._col.products.where('barcode', '==', barcode).limit(1).get();
        if (snap.empty) return null;
        const d = snap.docs[0];
        return { id: d.id, ...d.data() };
    },

    /**
     * Busca un producto por su ID (documento Firestore).
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getProductById(id) {
        const doc = await this._col.products.doc(String(id)).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    /**
     * Agrega un nuevo producto.
     * @param {Object} product
     * @returns {Promise<string>} ID generado por Firestore
     */
    async addProduct(product) {
        product.createdAt = Date.now();
        product.updatedAt = Date.now();
        const ref = await this._col.products.add(product);
        return ref.id;
    },

    /**
     * Actualiza un producto existente.
     * @param {Object} product - Debe incluir el campo 'id'
     * @returns {Promise<void>}
     */
    async updateProduct(product) {
        const id = String(product.id);
        const data = { ...product };
        delete data.id;
        data.updatedAt = Date.now();
        await this._col.products.doc(id).set(data);
    },

    /**
     * Elimina un producto.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteProduct(id) {
        await this._col.products.doc(String(id)).delete();
    },

    /**
     * Busca productos por nombre, código o categoría (para el POS).
     * Firestore no tiene búsqueda de texto libre, así que descargamos
     * todos los productos y filtramos en memoria (OK para tiendas pequeñas).
     * @param {string} query
     * @returns {Promise<Array>}
     */
    async searchProducts(query) {
        const all = await this.getAllProducts();
        const q = query.toLowerCase().trim();
        if (!q) return [];
        return all.filter(p =>
            (p.name     && p.name.toLowerCase().includes(q)) ||
            (p.barcode  && p.barcode.includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
        ).slice(0, 20);
    },

    // ============ VENTAS ============

    /**
     * Registra una nueva venta.
     * @param {Object} sale
     * @returns {Promise<string>} ID generado
     */
    async addSale(sale) {
        sale.dateKey = Utils.getDateKey(sale.timestamp);
        const ref = await this._col.sales.add(sale);
        return ref.id;
    },

    /**
     * Obtiene todas las ventas ordenadas por fecha descendente.
     * @returns {Promise<Array>}
     */
    async getAllSales() {
        const snap = await this._col.sales.orderBy('timestamp', 'desc').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /**
     * Obtiene las ventas de una fecha específica.
     * @param {string} dateKey - YYYY-MM-DD
     * @returns {Promise<Array>}
     */
    async getSalesByDate(dateKey) {
        const snap = await this._col.sales.where('dateKey', '==', dateKey).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /**
     * Obtiene una venta por su ID.
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getSaleById(id) {
        const doc = await this._col.sales.doc(String(id)).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    /**
     * Obtiene las ventas de los últimos N días.
     * @param {number} days
     * @returns {Promise<Array>}
     */
    async getRecentSales(days = 7) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const snap = await this._col.sales
            .where('timestamp', '>=', cutoff)
            .orderBy('timestamp', 'desc')
            .get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    // ============ CONFIGURACIÓN ============

    /**
     * Obtiene un valor de configuración.
     * @param {string} key
     * @returns {Promise<any>}
     */
    async getSetting(key) {
        const doc = await this._col.settings.doc(key).get();
        return doc.exists ? doc.data().value : null;
    },

    /**
     * Guarda un valor de configuración.
     * @param {string} key
     * @param {any} value
     * @returns {Promise<void>}
     */
    async setSetting(key, value) {
        await this._col.settings.doc(key).set({ value });
    },

    /**
     * Carga datos de demostración si no hay productos.
     * Solo se ejecuta una vez por proyecto (no por dispositivo).
     */
    async seedDemoDataIfEmpty() {
        const products = await this.getAllProducts();
        if (products.length > 0) return;

        const demoProducts = [
            { barcode: '7501000001', name: 'Coca-Cola 600ml',        category: 'Bebidas',   price: 18, cost: 13, stock: 24 },
            { barcode: '7501000002', name: 'Sabritas Original 45g',  category: 'Botanas',   price: 16, cost: 11, stock: 30 },
            { barcode: '7501000003', name: 'Leche Lala 1L',          category: 'Lácteos',   price: 28, cost: 22, stock: 12 },
            { barcode: '7501000004', name: 'Pan Bimbo Grande',       category: 'Panadería', price: 45, cost: 36, stock: 8  },
            { barcode: '7501000005', name: 'Detergente Ariel 1kg',   category: 'Limpieza',  price: 32, cost: 25, stock: 15 },
            { barcode: '7501000006', name: 'Agua Ciel 1L',           category: 'Bebidas',   price: 12, cost: 7,  stock: 40 },
            { barcode: '7501000007', name: 'Pasta La Moderna 200g',  category: 'Abarrotes', price: 14, cost: 9,  stock: 3  },
            { barcode: '7501000008', name: 'Jugo Del Valle 1L',      category: 'Bebidas',   price: 30, cost: 23, stock: 10 },
            { barcode: '7501000009', name: 'Galletas Marías Gamesa', category: 'Botanas',   price: 15, cost: 10, stock: 0  },
            { barcode: '7501000010', name: 'Jabón Zote Rosa',        category: 'Limpieza',  price: 22, cost: 16, stock: 18 },
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
            sales:    await this.getAllSales(),
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
            total,
            sales: todaySales
        };
    }
};
