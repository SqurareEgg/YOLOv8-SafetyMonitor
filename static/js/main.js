class SafetyMonitor {
    constructor() {
        this.alertSound = new Audio('/static/audio/alert.mp3');
        this.isAlertEnabled = true;
        this.init();
    }

    init() {
        this.setupAlertSystem();
        this.setupEventListeners();
    }

    setupAlertSystem() {
        this.alertSound.preload = 'auto';
        this.alertSound.volume = 0.7;
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.updateActiveNav();
        });

        document.addEventListener('safety-alert', (e) => {
            this.handleSafetyAlert(e.detail);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.stopAlert();
            }
        });
    }

    updateActiveNav() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }

    handleSafetyAlert(alertData) {
        if (this.isAlertEnabled) {
            this.playAlertSound();
            this.showAlertNotification(alertData);
        }
    }

    playAlertSound() {
        this.alertSound.currentTime = 0;
        this.alertSound.play().catch(e => {
            console.warn('오디오 재생 실패:', e);
        });
    }

    stopAlert() {
        this.alertSound.pause();
        this.alertSound.currentTime = 0;
    }

    showAlertNotification(alertData) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-warning alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            <strong>⚠️ 안전 경고!</strong><br>
            ${alertData.message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    toggleAlert(enabled) {
        this.isAlertEnabled = enabled;
    }

    showLoading(element) {
        const spinner = document.createElement('div');
        spinner.className = 'text-center';
        spinner.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>';
        element.appendChild(spinner);
        return spinner;
    }

    hideLoading(spinner) {
        if (spinner && spinner.parentNode) {
            spinner.remove();
        }
    }
}

const safetyMonitor = new SafetyMonitor();

function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString('ko-KR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}