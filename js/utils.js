/**
 * utils.js - Funciones de utilidad global
 * Funciones de formato, notificaciones y helpers reutilizables
 */

const Utils = {
    /**
     * Formatea un número como moneda (pesos mexicanos).
     * @param {number} value - Valor a formatear
     * @returns {string} Cadena con formato de moneda, ej: "$1,234.50"
     */
    formatCurrency(value) {
        const num = Number(value) || 0;
        return '$' + num.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    /**
     * Formatea una fecha como string legible en español.
     * @param {Date|string|number} date - Fecha a formatear
     * @returns {string} Fecha formateada, ej: "01/11/2026 15:30"
     */
    formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    },

    /**
     * Obtiene la fecha actual en formato YYYY-MM-DD (para comparaciones).
     * @param {Date|string|number} date - Fecha (opcional, por defecto hoy)
     * @returns {string} Fecha en formato YYYY-MM-DD
     */
    getDateKey(date) {
        const d = date ? new Date(date) : new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Obtiene el nombre corto del día de la semana.
     * @param {number} dayIndex - Índice del día (0=Domingo)
     * @returns {string} Nombre corto del día
     */
    getDayName(dayIndex) {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[dayIndex] || '';
    },

    /**
     * Genera un código de barras único para productos sin código.
     * Formato: 2 + timestamp + número aleatorio
     * @returns {string} Código de 13 dígitos
     */
    generateBarcode() {
        const timestamp = Date.now().toString().slice(-9);
        const random = Math.floor(Math.random() * 90 + 10);
        return '2' + timestamp + random;
    },

    /**
     * Genera un folio único para cada venta.
     * @returns {string} Folio de venta
     */
    generateFolio() {
        const now = new Date();
        const stamp = now.getTime().toString(36).toUpperCase();
        return 'V' + stamp;
    },

    /**
     * Escapa texto HTML para evitar inyección en el DOM.
     * @param {string} text - Texto a escapar
     * @returns {string} Texto seguro
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text ?? '');
        return div.innerHTML;
    },

    /**
     * Muestra una notificación toast temporal.
     * @param {string} message - Mensaje a mostrar
     * @param {'success'|'error'|'warning'|'info'} type - Tipo de notificación
     * @param {number} duration - Duración en ms (default 3000)
     */
    toast(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = 'toast';
        if (type !== 'info') toast.classList.add('toast-' + type);
        toast.classList.remove('hidden');

        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.add('hidden');
        }, duration);
    },

    /**
     * Valida que un valor sea un número positivo.
     * @param {*} value - Valor a validar
     * @returns {boolean}
     */
    isPositiveNumber(value) {
        const num = Number(value);
        return !isNaN(num) && num >= 0;
    },

    /**
     * Debounce: retrasa la ejecución de una función.
     * @param {Function} fn - Función a ejecutar
     * @param {number} delay - Retardo en ms
     * @returns {Function} Función con debounce
     */
    debounce(fn, delay = 300) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * Determina el estado del stock de un producto.
     * @param {number} stock - Cantidad en existencia
     * @param {number} threshold - Umbral mínimo (default 5)
     * @returns {{level: string, label: string, class: string}} Estado del stock
     */
    getStockStatus(stock, threshold = 5) {
        if (stock <= 0) {
            return { level: 'out', label: 'Agotado', class: 'stock-out' };
        } else if (stock <= threshold) {
            return { level: 'low', label: 'Bajo', class: 'stock-low' };
        } else {
            return { level: 'good', label: 'Disponible', class: 'stock-good' };
        }
    }
};
