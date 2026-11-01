/**
 * pos.js - Punto de venta (checkout)
 * Maneja la búsqueda de productos, el carrito, el cobro y el registro de ventas
 */

const POS = {
    cart: [],          // Array de { productId, barcode, name, price, quantity }
    searchResults: [],

    /**
     * Inicializa el módulo del punto de venta.
     */
    init() {
        this.bindEvents();
        // El listener de escáner USB se configura en app.js globalmente
    },

    /**
     * Vincula los eventos de la interfaz del POS.
     */
    bindEvents() {
        const searchInput = document.getElementById('pos-search');

        // Búsqueda de productos con debounce
        searchInput.addEventListener('input',
            Utils.debounce((e) => this.handleSearch(e.target.value), 250)
        );

        // Enter en el campo de búsqueda: intenta buscar por código de barras exacto
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleEnter(searchInput.value.trim());
            }
        });

        // Escanear con cámara
        document.getElementById('btn-camera-scan').addEventListener('click', () => {
            BarcodeUI.openForPOS();
        });

        // Vaciar carrito
        document.getElementById('btn-clear-cart').addEventListener('click', () => {
            this.clearCart();
        });

        // Efectivo recibido: calcular cambio
        document.getElementById('payment-received').addEventListener('input', (e) => {
            this.calculateChange();
        });

        // Botones de efectivo rápido
        document.querySelectorAll('.btn-cash').forEach(btn => {
            if (btn.id === 'btn-exact') {
                btn.addEventListener('click', () => {
                    const total = this.getCartTotal();
                    document.getElementById('payment-received').value = total.toFixed(2);
                    this.calculateChange();
                });
            } else {
                btn.addEventListener('click', () => {
                    const amount = parseFloat(btn.dataset.cash);
                    document.getElementById('payment-received').value = amount.toFixed(2);
                    this.calculateChange();
                });
            }
        });

        // Botón de cobrar
        document.getElementById('btn-checkout').addEventListener('click', () => {
            this.completeSale();
        });

        // Cerrar modal de venta completada
        document.getElementById('btn-close-sale-modal').addEventListener('click', () => {
            document.getElementById('sale-modal').classList.add('hidden');
        });

        // Imprimir recibo
        document.getElementById('btn-print-receipt').addEventListener('click', () => {
            this.printReceipt();
        });

        // Ocultar resultados al hacer clic fuera
        document.addEventListener('click', (e) => {
            const results = document.getElementById('pos-results');
            const searchBar = document.querySelector('.pos-search-bar');
            if (!searchBar.contains(e.target)) {
                results.classList.add('hidden');
            }
        });
    },

    /**
     * Maneja la búsqueda de productos mientras se escribe.
     * @param {string} query
     */
    async handleSearch(query) {
        const resultsDiv = document.getElementById('pos-results');

        if (query.length < 2) {
            resultsDiv.classList.add('hidden');
            return;
        }

        const results = await DB.searchProducts(query);

        // Si solo hay un resultado y el código de barras coincide exacto, agregar directo
        if (results.length === 1 && results[0].barcode === query.trim()) {
            this.addToCart(results[0]);
            document.getElementById('pos-search').value = '';
            resultsDiv.classList.add('hidden');
            return;
        }

        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="pos-result-item"><div class="pos-result-info"><div class="pos-result-name">Sin resultados</div><div class="pos-result-code">No se encontraron productos</div></div></div>';
        } else {
            resultsDiv.innerHTML = results.map(p => `
                <div class="pos-result-item" onclick="POS.selectProduct(${p.id})">
                    <div class="pos-result-icon">📦</div>
                    <div class="pos-result-info">
                        <div class="pos-result-name">${Utils.escapeHtml(p.name)}</div>
                        <div class="pos-result-code">${Utils.escapeHtml(p.barcode || '')} · Stock: ${p.stock}</div>
                    </div>
                    <div class="pos-result-price">${Utils.formatCurrency(p.price)}</div>
                </div>
            `).join('');
        }
        resultsDiv.classList.remove('hidden');
    },

    /**
     * Maneja la tecla Enter en la barra de búsqueda.
     * Si el texto coincide con un código de barras exacto, agrega el producto.
     * @param {string} value
     */
    async handleEnter(value) {
        if (!value) return;

        // Buscar por código de barras exacto
        const product = await DB.getProductByBarcode(value);
        if (product) {
            this.addToCart(product);
            document.getElementById('pos-search').value = '';
            document.getElementById('pos-results').classList.add('hidden');
            return;
        }

        // Si hay resultados de búsqueda, tomar el primero
        if (this.searchResults.length > 0) {
            this.selectProduct(this.searchResults[0].id);
        }
    },

    /**
     * Callback para el escáner USB de código de barras.
     * @param {string} code - Código escaneado
     */
    async handleScan(code) {
        // Solo procesar si estamos en la vista del POS
        if (!document.getElementById('view-pos').classList.contains('active')) return;

        const product = await DB.getProductByBarcode(code);
        if (product) {
            this.addToCart(product);
            Utils.toast(`${product.name} agregado`, 'success', 1500);
        } else {
            Utils.toast(`Código ${code} no encontrado. Agrega el producto primero.`, 'warning', 3000);
        }
    },

    /**
     * Selecciona un producto de los resultados de búsqueda.
     * @param {number} productId
     */
    async selectProduct(productId) {
        const product = await DB.getProductById(productId);
        if (product) {
            this.addToCart(product);
        }
        document.getElementById('pos-search').value = '';
        document.getElementById('pos-results').classList.add('hidden');
    },

    /**
     * Agrega un producto al carrito (o incrementa cantidad si ya está).
     * @param {Object} product
     */
    addToCart(product) {
        // Verificar stock disponible
        const existing = this.cart.find(item => item.productId === product.id);
        const currentQty = existing ? existing.quantity : 0;

        if (product.stock <= currentQty) {
            Utils.toast(`No hay más stock de "${product.name}"`, 'warning');
            return;
        }

        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({
                productId: product.id,
                barcode: product.barcode,
                name: product.name,
                price: product.price,
                quantity: 1,
                stock: product.stock
            });
        }

        this.renderCart();
        this.updateTotals();
    },

    /**
     * Cambia la cantidad de un producto en el carrito.
     * @param {number} productId
     * @param {number} delta - +1 o -1
     */
    changeQuantity(productId, delta) {
        const item = this.cart.find(i => i.productId === productId);
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            this.removeFromCart(productId);
            return;
        }

        if (delta > 0 && newQty > item.stock) {
            Utils.toast(`Solo hay ${item.stock} unidades disponibles`, 'warning');
            return;
        }

        item.quantity = newQty;
        this.renderCart();
        this.updateTotals();
    },

    /**
     * Establece una cantidad exacta en un item del carrito.
     * @param {number} productId
     * @param {number} qty
     */
    setQuantity(productId, qty) {
        const item = this.cart.find(i => i.productId === productId);
        if (!item) return;

        qty = parseInt(qty) || 0;
        if (qty <= 0) {
            this.removeFromCart(productId);
            return;
        }
        if (qty > item.stock) {
            Utils.toast(`Solo hay ${item.stock} unidades disponibles`, 'warning');
            qty = item.stock;
        }
        item.quantity = qty;
        this.renderCart();
        this.updateTotals();
    },

    /**
     * Elimina un producto del carrito.
     * @param {number} productId
     */
    removeFromCart(productId) {
        this.cart = this.cart.filter(i => i.productId !== productId);
        this.renderCart();
        this.updateTotals();
    },

    /**
     * Vacía el carrito completamente.
     */
    clearCart() {
        if (this.cart.length === 0) return;
        if (confirm('¿Vaciar el carrito completo?')) {
            this.cart = [];
            this.renderCart();
            this.updateTotals();
        }
    },

    /**
     * Renderiza el contenido del carrito.
     */
    renderCart() {
        const container = document.getElementById('cart-items');

        if (this.cart.length === 0) {
            container.innerHTML = '<p class="empty-state">El carrito está vacío. Escanea o busca productos para empezar.</p>';
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${Utils.escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${Utils.formatCurrency(item.price)} c/u</div>
                </div>
                <div class="cart-quantity">
                    <button class="qty-btn" onclick="POS.changeQuantity(${item.productId}, -1)">−</button>
                    <input type="number" class="qty-value" value="${item.quantity}"
                           onchange="POS.setQuantity(${item.productId}, this.value)" min="1" max="${item.stock}">
                    <button class="qty-btn" onclick="POS.changeQuantity(${item.productId}, 1)">+</button>
                </div>
                <div class="cart-item-total">${Utils.formatCurrency(item.price * item.quantity)}</div>
                <button class="cart-remove" onclick="POS.removeFromCart(${item.productId})">✕</button>
            </div>
        `).join('');
    },

    /**
     * Calcula el total del carrito.
     * @returns {number}
     */
    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    /**
     * Actualiza los totales mostrados en la interfaz.
     */
    updateTotals() {
        const total = this.getCartTotal();
        const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        document.getElementById('checkout-total').textContent = Utils.formatCurrency(total);
        document.getElementById('checkout-subtotal').textContent = Utils.formatCurrency(total);
        document.getElementById('checkout-count').textContent = count;

        // Habilitar/deshabilitar botón de cobro
        document.getElementById('btn-checkout').disabled = this.cart.length === 0;

        this.calculateChange();
    },

    /**
     * Calcula el cambio a devolver al cliente.
     */
    calculateChange() {
        const total = this.getCartTotal();
        const received = parseFloat(document.getElementById('payment-received').value) || 0;
        const change = received - total;

        const changeEl = document.getElementById('change-value');
        if (change < 0) {
            changeEl.textContent = Utils.formatCurrency(0);
            changeEl.style.color = 'var(--danger)';
        } else {
            changeEl.textContent = Utils.formatCurrency(change);
            changeEl.style.color = 'var(--success)';
        }
    },

    /**
     * Completa la venta: descuenta inventario, registra la venta y muestra el recibo.
     */
    async completeSale() {
        if (this.cart.length === 0) return;

        const total = this.getCartTotal();
        const received = parseFloat(document.getElementById('payment-received').value) || 0;

        if (received < total) {
            Utils.toast('El efectivo recibido es insuficiente', 'error');
            return;
        }

        const change = received - total;

        // Crear registro de venta
        const sale = {
            folio: Utils.generateFolio(),
            timestamp: Date.now(),
            items: this.cart.map(item => ({
                productId: item.productId,
                barcode: item.barcode,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            })),
            total: total,
            received: received,
            change: change,
            itemCount: this.cart.reduce((sum, item) => sum + item.quantity, 0)
        };

        try {
            // Registrar la venta
            await DB.addSale(sale);

            // Descontar inventario
            for (const item of this.cart) {
                const product = await DB.getProductById(item.productId);
                if (product) {
                    product.stock = Math.max(0, product.stock - item.quantity);
                    await DB.updateProduct(product);
                }
            }

            // Mostrar recibo
            this.showReceipt(sale);

            // Limpiar carrito y campos
            this.cart = [];
            this.renderCart();
            this.updateTotals();
            document.getElementById('payment-received').value = '';
            this.calculateChange();

            // Recargar inventario si está cargado
            await Inventory.load();

            // Actualizar dashboard
            if (Dashboard.refresh) Dashboard.refresh();

        } catch (error) {
            console.error('Error al completar venta:', error);
            Utils.toast('Error al procesar la venta. Intenta de nuevo.', 'error');
        }
    },

    /**
     * Muestra el modal con el recibo de la venta.
     * @param {Object} sale - Datos de la venta
     */
    showReceipt(sale) {
        const receipt = document.getElementById('receipt');
        const date = new Date(sale.timestamp);

        receipt.innerHTML = `
            <div class="receipt-header">
                CAJAGO<br>
                <span style="font-size:12px;font-weight:normal;">${Utils.formatDate(date)}</span><br>
                <span style="font-size:12px;font-weight:normal;">Folio: ${sale.folio}</span>
            </div>
            <div class="receipt-line"></div>
            ${sale.items.map(item => `
                <div class="receipt-item">
                    <span>${item.quantity}x ${item.name.substring(0, 22)}</span>
                    <span>${Utils.formatCurrency(item.subtotal)}</span>
                </div>
            `).join('')}
            <div class="receipt-line"></div>
            <div class="receipt-total">
                <span>TOTAL</span>
                <span>${Utils.formatCurrency(sale.total)}</span>
            </div>
            <div class="receipt-item">
                <span>Efectivo</span>
                <span>${Utils.formatCurrency(sale.received)}</span>
            </div>
            <div class="receipt-change">
                <span>Cambio</span>
                <span>${Utils.formatCurrency(sale.change)}</span>
            </div>
            <div class="receipt-line"></div>
            <div style="text-align:center;font-size:12px;">¡Gracias por su compra!</div>
        `;

        document.getElementById('sale-modal').classList.remove('hidden');
    },

    /**
     * Imprime el recibo (abre el diálogo de impresión del navegador).
     */
    printReceipt() {
        const receipt = document.getElementById('receipt').innerHTML;
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Recibo ${new Date().toLocaleDateString('es-MX')}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; font-size: 13px; }
                    .receipt-header { text-align: center; font-weight: bold; margin-bottom: 10px; }
                    .receipt-line { border-top: 1px dashed #999; margin: 8px 0; }
                    .receipt-item { display: flex; justify-content: space-between; }
                    .receipt-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; }
                    .receipt-change { display: flex; justify-content: space-between; color: green; }
                </style>
            </head>
            <body>${receipt}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
};
