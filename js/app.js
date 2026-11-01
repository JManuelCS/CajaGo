/**
 * app.js - Punto de entrada principal de CAJAGO
 * Inicializa la base de datos, los módulos y la navegación
 */

const App = {
    currentView: 'dashboard',

    /**
     * Inicializa la aplicación completa.
     */
    async init() {
        try {
            // 1. Inicializar base de datos
            await DB.init();

            // 2. Cargar datos de demostración si es la primera vez
            await DB.seedDemoDataIfEmpty();

            // 3. Inicializar módulos
            BarcodeUI.init();
            await Inventory.init();
            POS.init();
            await Sales.init();
            await Dashboard.init();

            // 4. Configurar escáner USB global
            Barcode.startUSBListener((code) => {
                POS.handleScan(code);
            });

            // 5. Configurar navegación
            this.bindNavigation();

            // 6. Mostrar la aplicación
            this.showApp();

        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            this.showError(error);
        }
    },

    /**
     * Configura la navegación entre vistas.
     */
    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.navigate(view);
            });
        });
    },

    /**
     * Navega a una vista específica.
     * @param {string} view - Nombre de la vista ('dashboard', 'pos', 'inventory', 'sales')
     */
    navigate(view) {
        // Actualizar botones de navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Mostrar/ocultar vistas
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        const viewEl = document.getElementById('view-' + view);
        if (viewEl) {
            viewEl.classList.add('active');
        }

        this.currentView = view;

        // Refrescar datos según la vista
        if (view === 'dashboard') {
            Dashboard.refresh();
        } else if (view === 'sales') {
            Sales.refresh();
        } else if (view === 'inventory') {
            Inventory.load();
        }

        // Cerrar modales abiertos al cambiar de vista
        document.querySelectorAll('.modal').forEach(m => {
            if (!m.classList.contains('hidden')) {
                m.classList.add('hidden');
            }
        });

        // Detener cámara si estaba activa
        Barcode.stopCamera();
    },

    /**
     * Oculta la pantalla de carga y muestra la aplicación.
     */
    showApp() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    },

    /**
     * Muestra un error si la inicialización falla.
     * @param {Error} error
     */
    showError(error) {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.innerHTML = `
                <div class="loading-content" style="color:white;">
                    <div class="loading-logo">⚠️</div>
                    <h1>Error al iniciar</h1>
                    <p>No se pudo inicializar el sistema.</p>
                    <p style="font-size:13px;opacity:0.7;margin-top:8px;">${Utils.escapeHtml(error.message)}</p>
                    <button onclick="location.reload()" style="margin-top:20px;padding:12px 28px;border:none;border-radius:10px;background:white;color:#dc2626;font-weight:600;cursor:pointer;font-size:15px;">Reintentar</button>
                </div>
            `;
        }
    },

    /**
     * Atajos de teclado globales.
     */
    bindShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F1 = ir a cobrar
            if (e.key === 'F1') {
                e.preventDefault();
                this.navigate('pos');
                setTimeout(() => document.getElementById('pos-search').focus(), 100);
            }
            // F2 = ir a productos
            if (e.key === 'F2') {
                e.preventDefault();
                this.navigate('inventory');
            }
            // F3 = ir a panel
            if (e.key === 'F3') {
                e.preventDefault();
                this.navigate('dashboard');
            }
            // F4 = ir a ventas
            if (e.key === 'F4') {
                e.preventDefault();
                this.navigate('sales');
            }
            // Escape = cerrar modales
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(m => {
                    m.classList.add('hidden');
                });
                Barcode.stopCamera();
            }
        });
    }
};

// ====== Inicialización al cargar la página ======
document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
    App.bindShortcuts();
});

// ====== Guardar datos antes de cerrar ======
window.addEventListener('beforeunload', () => {
    Barcode.stopCamera();
});
