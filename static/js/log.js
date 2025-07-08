class LogController {
    constructor() {
        this.logContainer = null;
        this.statsContainer = null;
        this.maxLogs = 50;
        this.updateInterval = 1000;
        this.stats = {
            personCount: 0,
            vehicleCount: 0,
            helmetCount: 0,
            vestCount: 0
        };
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            this.startLogUpdates();
        });
    }

    setupElements() {
        this.logContainer = document.getElementById('logContainer');
        this.setupStatsElements();
    }

    setupStatsElements() {
        this.statsElements = {
            personCount: document.getElementById('personCount'),
            vehicleCount: document.getElementById('vehicleCount'),
            helmetCount: document.getElementById('helmetCount'),
            vestCount: document.getElementById('vestCount')
        };
    }

    startLogUpdates() {
        this.fetchLogs();
        setInterval(() => this.fetchLogs(), this.updateInterval);
    }

    async fetchLogs() {
        try {
            const response = await fetch('/api/logs/recent');
            const data = await response.json();
            
            if (data.success) {
                this.updateLogs(data.logs);
                this.updateStats(data.stats);
            }
        } catch (error) {
            console.error('로그 가져오기 실패:', error);
        }
    }

    updateLogs(logs) {
        if (!this.logContainer) return;

        this.logContainer.innerHTML = '';
        
        logs.slice(-this.maxLogs).forEach(log => {
            const logElement = this.createLogElement(log);
            this.logContainer.appendChild(logElement);
        });

        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    createLogElement(log) {
        const logElement = document.createElement('div');
        logElement.className = `log-item ${this.getLogClass(log.type)}`;
        
        const timestamp = formatDateTime(log.timestamp);
        const alertIcon = this.getAlertIcon(log.type);
        
        logElement.innerHTML = `
            <div class="log-header">
                <span class="log-icon">${alertIcon}</span>
                <span class="log-time">${timestamp}</span>
            </div>
            <div class="log-message">${log.message}</div>
            ${log.details ? `<div class="log-details">${log.details}</div>` : ''}
        `;

        if (log.type === 'warning' || log.type === 'danger') {
            this.triggerAlert(log);
        }

        return logElement;
    }

    getLogClass(type) {
        const typeMap = {
            'info': 'log-info',
            'warning': 'log-warning',
            'danger': 'log-danger',
            'success': 'log-success'
        };
        return typeMap[type] || 'log-info';
    }

    getAlertIcon(type) {
        const iconMap = {
            'info': 'ℹ️',
            'warning': '⚠️',
            'danger': '🚨',
            'success': '✅'
        };
        return iconMap[type] || 'ℹ️';
    }

    triggerAlert(log) {
        const alertEvent = new CustomEvent('safety-alert', {
            detail: {
                type: log.type,
                message: log.message,
                timestamp: log.timestamp
            }
        });
        document.dispatchEvent(alertEvent);
    }

    updateStats(stats) {
        if (!stats) return;

        Object.keys(stats).forEach(key => {
            if (this.statsElements[key]) {
                this.statsElements[key].textContent = stats[key];
            }
        });

        this.stats = { ...this.stats, ...stats };
    }

    addLog(type, message, details = null) {
        const log = {
            type,
            message,
            details,
            timestamp: new Date().toISOString()
        };

        fetch('/api/logs/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(log)
        }).catch(error => {
            console.error('로그 추가 실패:', error);
        });
    }

    clearLogs() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
    }

    exportLogs() {
        fetch('/api/logs/export')
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `safety_logs_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('로그 내보내기 실패:', error);
            });
    }
}

const logController = new LogController();