/**
 * dashboard.js - Panel de control
 * Estadísticas, alertas de inventario y gráfica de ventas
 */

const Dashboard = {

    /**
     * Inicializa el panel de control.
     */
    async init() {
        await this.refresh();
    },

    /**
     * Refresca todos los datos del panel.
     */
    async refresh() {
        await Promise.all([
            this.renderStats(),
            this.renderLowStock(),
            this.renderTopProducts(),
            this.renderWeeklyChart()
        ]);
    },

    /**
     * Renderiza las tarjetas de estadísticas principales.
     */
    async renderStats() {
        // Ventas de hoy
        const todayStats = await DB.getTodayStats();
        document.getElementById('stat-today').textContent = Utils.formatCurrency(todayStats.total);
        document.getElementById('stat-transactions').textContent = todayStats.count;

        // Total de productos
        const products = await DB.getAllProducts();
        document.getElementById('stat-products').textContent = products.length;

        // Productos con inventario bajo
        const lowStock = products.filter(p => p.stock <= 5);
        document.getElementById('stat-lowstock').textContent = lowStock.length;
    },

    /**
     * Renderiza la lista de productos con inventario bajo.
     */
    async renderLowStock() {
        const container = document.getElementById('lowstock-list');
        const products = await DB.getAllProducts();
        const lowStock = products.filter(p => p.stock <= 5)
            .sort((a, b) => a.stock - b.stock);

        if (lowStock.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay alertas. Todo el inventario está en buen nivel. ✅</p>';
            return;
        }

        container.innerHTML = lowStock.map(p => {
            const status = Utils.getStockStatus(p.stock);
            const badgeClass = p.stock === 0 ? 'badge-danger' : 'badge-warning';
            const label = p.stock === 0 ? 'Agotado' : `${p.stock} en stock`;
            return `
                <div class="list-item">
                    <div>
                        <div class="list-item-name">${Utils.escapeHtml(p.name)}</div>
                        <div class="list-item-detail">${Utils.escapeHtml(p.category || 'General')}</div>
                    </div>
                    <span class="badge ${badgeClass}">${label}</span>
                </div>
            `;
        }).join('');
    },

    /**
     * Renderiza los productos más vendidos.
     */
    async renderTopProducts() {
        const container = document.getElementById('top-products');
        const recentSales = await DB.getRecentSales(30);

        // Contar ventas por producto
        const productCount = {};
        for (const sale of recentSales) {
            for (const item of sale.items) {
                if (!productCount[item.productId]) {
                    productCount[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
                }
                productCount[item.productId].quantity += item.quantity;
                productCount[item.productId].revenue += item.subtotal;
            }
        }

        // Ordenar por cantidad vendida y tomar top 5
        const top = Object.values(productCount)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        if (top.length === 0) {
            container.innerHTML = '<p class="empty-state">Aún no hay ventas registradas.</p>';
            return;
        }

        container.innerHTML = top.map((p, i) => `
            <div class="list-item">
                <div>
                    <div class="list-item-name">${i + 1}. ${Utils.escapeHtml(p.name)}</div>
                    <div class="list-item-detail">${p.quantity} unidades vendidas</div>
                </div>
                <span class="badge badge-success">${Utils.formatCurrency(p.revenue)}</span>
            </div>
        `).join('');
    },

    /**
     * Renderiza una gráfica de barras con las ventas de la última semana.
     */
    async renderWeeklyChart() {
        const container = document.getElementById('weekly-chart');
        const allSales = await DB.getAllSales();

        // Preparar datos de los últimos 7 días
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = Utils.getDateKey(date);
            days.push({
                dateKey,
                label: Utils.getDayName(date.getDay()),
                total: 0
            });
        }

        // Sumar ventas por día
        for (const sale of allSales) {
            const day = days.find(d => d.dateKey === sale.dateKey);
            if (day) {
                day.total += sale.total;
            }
        }

        const maxTotal = Math.max(...days.map(d => d.total), 1);

        if (allSales.length === 0) {
            container.innerHTML = '<p class="empty-state">Aún no hay datos suficientes.</p>';
            return;
        }

        container.innerHTML = `
            <div class="chart-bars">
                ${days.map(d => {
                    const heightPct = (d.total / maxTotal) * 100;
                    return `
                        <div class="chart-bar-group">
                            <div class="chart-bar-value">${d.total > 0 ? Utils.formatCurrency(d.total) : ''}</div>
                            <div class="chart-bar" style="height: ${Math.max(heightPct, 3)}%; min-height: 4px;" title="${Utils.formatCurrency(d.total)}"></div>
                            <div class="chart-bar-label">${d.label}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
};
