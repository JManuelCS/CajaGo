/**
 * sales.js - Historial de ventas
 * Lista de ventas, filtro por fecha y detalle de cada venta
 */

const Sales = {
    allSales: [],
    filteredSales: [],

    /**
     * Inicializa el módulo de historial de ventas.
     */
    async init() {
        this.bindEvents();
        await this.load();
    },

    /**
     * Vincula los eventos de la interfaz.
     */
    bindEvents() {
        // Filtro por fecha
        document.getElementById('sales-date-filter').addEventListener('change', (e) => {
            this.filterByDate(e.target.value);
        });

        // Limpiar filtro
        document.getElementById('btn-clear-date-filter').addEventListener('click', () => {
            document.getElementById('sales-date-filter').value = '';
            this.filteredSales = [...this.allSales];
            this.renderTable();
        });

        // Cerrar modal de detalle
        document.getElementById('btn-close-sale-detail').addEventListener('click', () => {
            document.getElementById('sale-detail-modal').classList.add('hidden');
        });
    },

    /**
     * Carga todas las ventas desde la base de datos.
     */
    async load() {
        this.allSales = await DB.getAllSales();
        this.filteredSales = [...this.allSales];
        this.renderTable();
    },

    /**
     * Filtra las ventas por fecha.
     * @param {string} dateKey - Fecha en formato YYYY-MM-DD
     */
    filterByDate(dateKey) {
        if (!dateKey) {
            this.filteredSales = [...this.allSales];
        } else {
            this.filteredSales = this.allSales.filter(s => s.dateKey === dateKey);
        }
        this.renderTable();
    },

    /**
     * Renderiza la tabla de ventas.
     */
    renderTable() {
        const tbody = document.getElementById('sales-body');
        const empty = document.getElementById('sales-empty');
        const table = document.getElementById('sales-table');

        if (this.filteredSales.length === 0) {
            tbody.innerHTML = '';
            empty.classList.remove('hidden');
            empty.textContent = this.allSales.length === 0
                ? 'No hay ventas registradas todavía.'
                : 'No hay ventas para la fecha seleccionada.';
            table.style.display = 'none';
            return;
        }

        empty.classList.add('hidden');
        table.style.display = '';

        tbody.innerHTML = this.filteredSales.map(s => `
            <tr>
                <td><code>${s.folio}</code></td>
                <td>${Utils.formatDate(s.timestamp)}</td>
                <td>${s.itemCount} artículo(s)</td>
                <td><strong>${Utils.formatCurrency(s.total)}</strong></td>
                <td>
                    <button class="btn btn-edit" onclick="Sales.showDetail('${s.id}')">👁️ Ver</button>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Muestra el detalle de una venta en un modal.
     * @param {number} saleId - ID de la venta
     */
    async showDetail(saleId) {
        const sale = await DB.getSaleById(saleId);
        if (!sale) return;

        const content = document.getElementById('sale-detail-content');
        content.innerHTML = `
            <div class="sale-detail-section">
                <div class="sale-detail-info">
                    <div>
                        <strong>Folio:</strong> ${sale.folio}<br>
                        <strong>Fecha:</strong> ${Utils.formatDate(sale.timestamp)}
                    </div>
                    <div style="text-align:right;">
                        <strong>Artículos:</strong> ${sale.itemCount}<br>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sale.items.map(item => `
                            <tr>
                                <td>${Utils.escapeHtml(item.name)}</td>
                                <td>${item.quantity}</td>
                                <td>${Utils.formatCurrency(item.price)}</td>
                                <td>${Utils.formatCurrency(item.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top:16px;display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:700;">
                    <span>TOTAL:</span>
                    <span>${Utils.formatCurrency(sale.total)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;color:var(--gray-500);">
                    <span>Efectivo recibido:</span>
                    <span>${Utils.formatCurrency(sale.received)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;color:var(--success);font-weight:600;">
                    <span>Cambio:</span>
                    <span>${Utils.formatCurrency(sale.change)}</span>
                </div>
            </div>
        `;

        document.getElementById('sale-detail-modal').classList.remove('hidden');
    },

    /**
     * Recarga los datos (útil después de una venta nueva).
     */
    async refresh() {
        await this.load();
    }
};
