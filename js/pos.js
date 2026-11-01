/**
 * pos.js - Punto de venta (checkout)
 * Maneja la búsqueda de productos, el carrito, el cobro y el registro de ventas
 */

const POS = {
    cart: [],               // Array de items del carrito
    searchResults: [],
    paymentMethod: 'cash',  // 'cash' | 'card'

    /**
     * Inicializa el módulo del punto de venta.
     */
    init() {
        this.bindEvents();
        // El listener de escáner USB se configura en app.js globalmente
    },

    /**
     * Cambia el método de pago activo (efectivo o tarjeta).
     * @param {'cash'|'card'} method
     */
    setPaymentMethod(method) {
        this.paymentMethod = method;

        // Actualizar botones
        document.getElementById('btn-pay-cash').classList.toggle('active', method === 'cash');
        document.getElementById('btn-pay-card').classList.toggle('active', method === 'card');

        // Mostrar/ocultar sección de efectivo
        document.getElementById('cash-section').style.display = method === 'cash' ? '' : 'none';

        // Actualizar texto del botón de cobrar
        document.getElementById('btn-checkout').innerHTML =
            method === 'cash' ? '💵 Cobrar' : '💳 Cobrar con tarjeta';

        this.calculateChange();
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

        // Enter en el campo de búsqueda
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
        document.getElementById('payment-received').addEventListener('input', () => {
            this.calculateChange();
        });

        // Botones de efectivo rápido
        document.querySelectorAll('.btn-cash').forEach(btn => {
            if (btn.id === 'btn-exact') {
                btn.addEventListener('click', () => {
                    document.getElementById('payment-received').value = this.getCartTotal().toFixed(2);
                    this.calculateChange();
                });
            } else {
                btn.addEventListener('click', () => {
                    document.getElementById('payment-received').value = parseFloat(btn.dataset.cash).toFixed(2);
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

        // Modal de captura de peso
        document.getElementById('btn-confirm-weight').addEventListener('click', () => {
            this._confirmWeight();
        });
        document.getElementById('btn-cancel-weight').addEventListener('click', () => {
            document.getElementById('weight-modal').classList.add('hidden');
        });
        document.getElementById('weight-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._confirmWeight();
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

    // ─── BÚSQUEDA ────────────────────────────────────────────────────────────

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

        // Coincidencia exacta de código → agregar directo
        if (results.length === 1 && results[0].barcode === query.trim()) {
            this.addToCart(results[0]);
            document.getElementById('pos-search').value = '';
            resultsDiv.classList.add('hidden');
            return;
        }

        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="pos-result-item"><div class="pos-result-info"><div class="pos-result-name">Sin resultados</div><div class="pos-result-code">No se encontraron productos</div></div></div>';
        } else {
            resultsDiv.innerHTML = results.map(p => {
                const priceLabel = p.soldByWeight
                    ? `${Utils.formatCurrency(p.price)}/kg`
                    : Utils.formatCurrency(p.price);
                const stockLabel = p.soldByWeight
                    ? `Stock: ${p.stock} ${p.unit || 'kg'}`
                    : `Stock: ${p.stock}`;
                return `
                <div class="pos-result-item" onclick="POS.selectProduct('${p.id}')">
                    <div class="pos-result-icon">${p.soldByWeight ? '⚖️' : '📦'}</div>
                    <div class="pos-result-info">
                        <div class="pos-result-name">${Utils.escapeHtml(p.name)}</div>
                        <div class="pos-result-code">${Utils.escapeHtml(p.barcode || '')} · ${stockLabel}</div>
                    </div>
                    <div class="pos-result-price">${priceLabel}</div>
                </div>`;
            }).join('');
        }
        resultsDiv.classList.remove('hidden');
    },

    /**
     * Maneja la tecla Enter en la barra de búsqueda.
     * @param {string} value
     */
    async handleEnter(value) {
        if (!value) return;
        const product = await DB.getProductByBarcode(value);
        if (product) {
            this.addToCart(product);
            document.getElementById('pos-search').value = '';
            document.getElementById('pos-results').classList.add('hidden');
            return;
        }
        if (this.searchResults.length > 0) {
            this.selectProduct(this.searchResults[0].id);
        }
    },

    /**
     * Callback para el escáner USB de código de barras.
     * @param {string} code
     */
    async handleScan(code) {
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
     * Selecciona un producto de los resultados.
     * Si es por peso, abre el modal de captura de peso.
     * @param {string} productId
     */
    async selectProduct(productId) {
        const product = await DB.getProductById(productId);
        if (product) this.addToCart(product);
        document.getElementById('pos-search').value = '';
        document.getElementById('pos-results').classList.add('hidden');
    },

    // ─── PESO ─────────────────────────────────────────────────────────────────

    /**
     * Abre el modal para capturar el peso de un producto.
     * @param {Object} product
     */
    _openWeightModal(product) {
        this._pendingWeightProduct = product;
        document.getElementById('weight-modal-title').textContent = product.name;
        document.getElementById('weight-unit-label').textContent = product.unit || 'kg';
        document.getElementById('weight-price-hint').textContent =
            `Precio: ${Utils.formatCurrency(product.price)} por kg`;
        document.getElementById('weight-input').value = '';
        document.getElementById('weight-modal').classList.remove('hidden');
        setTimeout(() => document.getElementById('weight-input').focus(), 100);
    },

    /**
     * Confirma el peso ingresado y agrega el producto al carrito.
     */
    _confirmWeight() {
        const product = this._pendingWeightProduct;
        if (!product) return;

        const weight = parseFloat(document.getElementById('weight-input').value);
        const unit = product.unit || 'kg';

        if (!weight || weight <= 0) {
            Utils.toast('Ingresa un peso válido mayor a 0', 'error');
            return;
        }

        // Siempre trabajamos en kg internamente
        const weightInKg = unit === 'g' ? weight / 1000 : weight;

        if (weightInKg > product.stock) {
            Utils.toast(`Solo hay ${product.stock} ${unit} disponibles`, 'warning');
            return;
        }

        document.getElementById('weight-modal').classList.add('hidden');
        this._pendingWeightProduct = null;

        const existing = this.cart.find(i => i.productId === product.id);
        if (existing) {
            existing.quantity = parseFloat((existing.quantity + weightInKg).toFixed(4));
        } else {
            this.cart.push({
                productId: product.id,
                barcode: product.barcode,
                name: product.name,
                price: product.price,   // precio por kg
                quantity: weightInKg,   // cantidad = peso en kg
                stock: product.stock,
                soldByWeight: true,
                unit
            });
        }

        this.renderCart();
        this.updateTotals();
    },

    // ─── CARRITO ──────────────────────────────────────────────────────────────

    /**
     * Agrega un producto al carrito.
     * Si es por peso, abre el modal de captura de peso.
     * @param {Object} product
     */
    addToCart(product) {
        if (product.soldByWeight) {
            this._openWeightModal(product);
            return;
        }

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
                stock: product.stock,
                soldByWeight: false
            });
        }

        this.renderCart();
        this.updateTotals();
    },

    /**
     * Cambia la cantidad de un producto por pieza.
     * @param {string} productId
     * @param {number} delta
     */
    changeQuantity(productId, delta) {
        const item = this.cart.find(i => i.productId === productId);
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty <= 0) { this.removeFromCart(productId); return; }
        if (delta > 0 && newQty > item.stock) {
            Utils.toast(`Solo hay ${item.stock} unidades disponibles`, 'warning');
            return;
        }
        item.quantity = newQty;
        this.renderCart();
        this.updateTotals();
    },

    /**
     * Establece una cantidad exacta en un item.
     * @param {string} productId
     * @param {number} qty
     */
    setQuantity(productId, qty) {
        const item = this.cart.find(i => i.productId === productId);
        if (!item) return;
        qty = parseInt(qty) || 0;
        if (qty <= 0) { this.removeFromCart(productId); return; }
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
     * @param {string} productId
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
     * Abre el modal de peso para editar la cantidad de un producto por peso ya en el carrito.
     * @param {string} productId
     */
    async editWeight(productId) {
        const item = this.cart.find(i => i.productId === productId);
        if (!item) return;
        const product = await DB.getProductById(productId);
        if (product) {
            // Quita el item actual para que _confirmWeight lo vuelva a agregar
            this.cart = this.cart.filter(i => i.productId !== productId);
            this._openWeightModal(product);
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

        container.innerHTML = this.cart.map(item => {
            if (item.soldByWeight) {
                const unit = item.unit || 'kg';
                const displayQty = unit === 'g'
                    ? `${(item.quantity * 1000).toFixed(0)} g`
                    : `${item.quantity.toFixed(3)} kg`;
                return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">⚖️ ${Utils.escapeHtml(item.name)}</div>
                        <div class="cart-item-price">${Utils.formatCurrency(item.price)}/kg · ${displayQty}</div>
                    </div>
                    <div class="cart-quantity">
                        <button class="btn btn-secondary btn-small" onclick="POS.editWeight('${item.productId}')">✏️ Peso</button>
                    </div>
                    <div class="cart-item-total">${Utils.formatCurrency(item.price * item.quantity)}</div>
                    <button class="cart-remove" onclick="POS.removeFromCart('${item.productId}')">✕</button>
                </div>`;
            }
            return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${Utils.escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${Utils.formatCurrency(item.price)} c/u</div>
                </div>
                <div class="cart-quantity">
                    <button class="qty-btn" onclick="POS.changeQuantity('${item.productId}', -1)">−</button>
                    <input type="number" class="qty-value" value="${item.quantity}"
                           onchange="POS.setQuantity('${item.productId}', this.value)" min="1" max="${item.stock}">
                    <button class="qty-btn" onclick="POS.changeQuantity('${item.productId}', 1)">+</button>
                </div>
                <div class="cart-item-total">${Utils.formatCurrency(item.price * item.quantity)}</div>
                <button class="cart-remove" onclick="POS.removeFromCart('${item.productId}')">✕</button>
            </div>`;
        }).join('');
    },

    // ─── TOTALES ──────────────────────────────────────────────────────────────

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
        document.getElementById('checkout-count').textContent = count % 1 === 0 ? count : count.toFixed(3);

        document.getElementById('btn-checkout').disabled = this.cart.length === 0;

        this.calculateChange();
    },

    /**
     * Calcula el cambio a devolver al cliente (solo aplica con efectivo).
     */
    calculateChange() {
        if (this.paymentMethod === 'card') return;

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

    // ─── COBRO ────────────────────────────────────────────────────────────────

    /**
     * Completa la venta: descuenta inventario, registra la venta y muestra el recibo.
     */
    async completeSale() {
        if (this.cart.length === 0) return;

        const total = this.getCartTotal();
        let received = total;
        let change = 0;

        if (this.paymentMethod === 'cash') {
            received = parseFloat(document.getElementById('payment-received').value) || 0;
            if (received < total) {
                Utils.toast('El efectivo recibido es insuficiente', 'error');
                return;
            }
            change = received - total;
        }

        const sale = {
            folio: Utils.generateFolio(),
            timestamp: Date.now(),
            paymentMethod: this.paymentMethod,
            items: this.cart.map(item => ({
                productId: item.productId,
                barcode: item.barcode,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                soldByWeight: item.soldByWeight || false,
                unit: item.unit || 'pza',
                subtotal: item.price * item.quantity
            })),
            total,
            received,
            change,
            itemCount: this.cart.reduce((sum, item) => sum + item.quantity, 0)
        };

        try {
            await DB.addSale(sale);

            // Descontar inventario
            for (const item of this.cart) {
                const product = await DB.getProductById(item.productId);
                if (product) {
                    product.stock = Math.max(0, parseFloat((product.stock - item.quantity).toFixed(4)));
                    await DB.updateProduct(product);
                }
            }

            this.showReceipt(sale);

            this.cart = [];
            this.renderCart();
            this.updateTotals();
            document.getElementById('payment-received').value = '';
            this.calculateChange();

            await Inventory.load();
            if (Dashboard.refresh) Dashboard.refresh();

        } catch (error) {
            console.error('Error al completar venta:', error);
            Utils.toast('Error al procesar la venta. Intenta de nuevo.', 'error');
        }
    },

    // ─── RECIBO ───────────────────────────────────────────────────────────────

    /**
     * Muestra el modal con el recibo de la venta.
     * @param {Object} sale
     */
    showReceipt(sale) {
        const receipt = document.getElementById('receipt');
        const isCard = sale.paymentMethod === 'card';

        receipt.innerHTML = `
            <div class="receipt-header">
                CAJAGO<br>
                <span style="font-size:12px;font-weight:normal;">${Utils.formatDate(new Date(sale.timestamp))}</span><br>
                <span style="font-size:12px;font-weight:normal;">Folio: ${sale.folio}</span>
            </div>
            <div class="receipt-line"></div>
            ${sale.items.map(item => {
                const qtyLabel = item.soldByWeight
                    ? `${item.quantity.toFixed(3)} kg`
                    : `${item.quantity}x`;
                return `
                <div class="receipt-item">
                    <span>${qtyLabel} ${item.name.substring(0, 20)}</span>
                    <span>${Utils.formatCurrency(item.subtotal)}</span>
                </div>`;
            }).join('')}
            <div class="receipt-line"></div>
            <div class="receipt-total">
                <span>TOTAL</span>
                <span>${Utils.formatCurrency(sale.total)}</span>
            </div>
            <div class="receipt-item">
                <span>${isCard ? '💳 Tarjeta' : 'Efectivo'}</span>
                <span>${isCard ? '—' : Utils.formatCurrency(sale.received)}</span>
            </div>
            ${!isCard ? `
            <div class="receipt-change">
                <span>Cambio</span>
                <span>${Utils.formatCurrency(sale.change)}</span>
            </div>` : ''}
            <div class="receipt-line"></div>
            <div style="text-align:center;font-size:12px;">¡Gracias por su compra!</div>
        `;

        document.getElementById('sale-modal').classList.remove('hidden');
    },

    /**
     * Imprime el recibo.
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
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    }
};
