/**
 * barcode.js - Manejo de escaneo de códigos de barras
 * Soporta dos métodos:
 * 1. Escáner USB (detecta entrada rápida de teclado)
 * 2. Cámara del dispositivo (usando ZXing)
 */

const Barcode = {
    // Detección de escáner USB
    usbBuffer: '',
    usbTimer: null,
    usbThreshold: 50,      // ms entre teclas para considerar escáner
    usbMinLength: 4,       // longitud mínima de un código válido
    onScanCallback: null,
    boundKeydown: null,    // Referencia guardada para removeEventListener

    // Cámara
    cameraStream: null,
    cameraReader: null,
    cameraControls: null,
    cameraCallback: null,

    /**
     * Inicia la escucha de escáner USB.
     * Detecta entrada de texto muy rápida (típica de un lector de código de barras).
     * @param {Function} callback - Se llama con el código escaneado
     */
    startUSBListener(callback) {
        this.onScanCallback = callback;
        // Guardar la referencia para poder quitarla después
        this.boundKeydown = this._handleKeydown.bind(this);
        document.addEventListener('keydown', this.boundKeydown);
    },

    /**
     * Maneja los eventos de teclado para detectar escáner USB.
     * @param {KeyboardEvent} e
     */
    _handleKeydown(e) {
        // Ignorar teclas modificadoras y especiales
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key.length !== 1 && e.key !== 'Enter') return;

        // Si el foco está en un input de texto, no interferir (a menos que sea Enter en campo de búsqueda)
        const active = document.activeElement;
        const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (isInput && e.key !== 'Enter') {
            // El usuario está escribiendo manualmente, no interferir
            this.usbBuffer = '';
            return;
        }

        clearTimeout(this.usbTimer);

        if (e.key === 'Enter') {
            if (this.usbBuffer.length >= this.usbMinLength) {
                // Código completo escaneado
                const code = this.usbBuffer;
                this.usbBuffer = '';
                if (this.onScanCallback) {
                    this.onScanCallback(code);
                }
                e.preventDefault();
            } else {
                this.usbBuffer = '';
            }
            return;
        }

        this.usbBuffer += e.key;
        this.usbTimer = setTimeout(() => {
            this.usbBuffer = '';
        }, this.usbThreshold);
    },

    /**
     * Detiene la escucha del escáner USB.
     */
    stopUSBListener() {
        if (this.boundKeydown) {
            document.removeEventListener('keydown', this.boundKeydown);
            this.boundKeydown = null;
        }
        clearTimeout(this.usbTimer);
        this.usbBuffer = '';
    },

    /**
     * Inicia la cámara para escanear códigos de barras.
     * @param {HTMLVideoElement} videoElement - Elemento de video
     * @param {Function} onDetected - Callback cuando se detecta un código
     * @param {Function} onError - Callback en caso de error
     */
    async startCamera(videoElement, onDetected, onError) {
        this.cameraCallback = onDetected;

        try {
            // Verificar que ZXingBrowser esté disponible (librería @zxing/browser vía CDN)
            if (typeof ZXingBrowser === 'undefined' || !ZXingBrowser.BrowserMultiFormatReader) {
                throw new Error('Librería de escaneo no disponible. Verifica tu conexión a internet.');
            }

            // Crear el lector (sin hints usa todos los formatos por defecto)
            this.cameraReader = new ZXingBrowser.BrowserMultiFormatReader();

            // Intentar usar la cámara trasera en dispositivos móviles
            const constraints = {
                video: { facingMode: 'environment' }
            };

            this.cameraControls = this.cameraReader.decodeFromConstraints(
                constraints,
                videoElement,
                (result, err, controls) => {
                    if (result) {
                        const code = result.getText();
                        if (code && this.cameraCallback) {
                            this.cameraCallback(code);
                        }
                    }
                }
            );

        } catch (error) {
            console.error('Error al iniciar cámara:', error);
            if (onError) {
                onError(error);
            }
        }
    },

    /**
     * Detiene la cámara y libera recursos.
     */
    stopCamera() {
        if (this.cameraControls) {
            try {
                // IScannerControls tiene método stop()
                if (this.cameraControls.stop) this.cameraControls.stop();
                else if (this.cameraReader && this.cameraReader.reset) this.cameraReader.reset();
            } catch (e) {
                // Ignorar errores al cerrar
            }
            this.cameraControls = null;
        }
        if (this.cameraReader) {
            try {
                if (this.cameraReader.reset) this.cameraReader.reset();
            } catch (e) {
                // Ignorar
            }
            this.cameraReader = null;
        }
        this.cameraCallback = null;
    },

    /**
     * Verifica si el navegador soporta acceso a la cámara.
     * @returns {boolean}
     */
    isCameraSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
};
