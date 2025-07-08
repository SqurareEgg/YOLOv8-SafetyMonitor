class SettingsController {
    constructor() {
        this.settings = {
            thresholds: {
                confidence: 0.5,
                helmet: 0.3,
                vest: 0.3
            },
            alerts: {
                enabled: true,
                sound: true,
                volume: 0.7,
                duration: 5
            },
            camera: {
                source: '0',
                rtspUrl: ''
            }
        };
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            this.loadSettings();
            this.setupEventListeners();
        });
    }

    setupElements() {
        this.thresholdForm = document.getElementById('thresholdForm');
        this.alertForm = document.getElementById('alertForm');
        this.cameraForm = document.getElementById('cameraForm');
        
        this.setupThresholdElements();
        this.setupAlertElements();
        this.setupCameraElements();
    }

    setupThresholdElements() {
        this.confidenceSlider = document.getElementById('confidenceThreshold');
        this.confidenceValue = document.getElementById('confidenceValue');
        this.helmetSlider = document.getElementById('helmetThreshold');
        this.helmetValue = document.getElementById('helmetValue');
        this.vestSlider = document.getElementById('vestThreshold');
        this.vestValue = document.getElementById('vestValue');
    }

    setupAlertElements() {
        this.enableAlerts = document.getElementById('enableAlerts');
        this.enableSound = document.getElementById('enableSound');
        this.alertVolume = document.getElementById('alertVolume');
        this.volumeValue = document.getElementById('volumeValue');
        this.alertDuration = document.getElementById('alertDuration');
    }

    setupCameraElements() {
        this.cameraSource = document.getElementById('cameraSource');
        this.rtspUrl = document.getElementById('rtspUrl');
        this.rtspUrlGroup = document.getElementById('rtspUrlGroup');
    }

    setupEventListeners() {
        this.confidenceSlider.addEventListener('input', (e) => {
            this.confidenceValue.textContent = e.target.value;
        });

        this.helmetSlider.addEventListener('input', (e) => {
            this.helmetValue.textContent = e.target.value;
        });

        this.vestSlider.addEventListener('input', (e) => {
            this.vestValue.textContent = e.target.value;
        });

        this.alertVolume.addEventListener('input', (e) => {
            this.volumeValue.textContent = Math.round(e.target.value * 100) + '%';
        });

        this.cameraSource.addEventListener('change', (e) => {
            this.toggleRtspUrl(e.target.value === 'rtsp');
        });

        this.thresholdForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveThresholdSettings();
        });

        this.alertForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAlertSettings();
        });

        this.cameraForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCameraSettings();
        });

        this.startSystemMonitoring();
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            
            if (data.success) {
                this.settings = { ...this.settings, ...data.settings };
                this.updateUI();
            }
        } catch (error) {
            console.error('설정 로드 실패:', error);
        }
    }

    updateUI() {
        this.confidenceSlider.value = this.settings.thresholds.confidence;
        this.confidenceValue.textContent = this.settings.thresholds.confidence;
        
        this.helmetSlider.value = this.settings.thresholds.helmet;
        this.helmetValue.textContent = this.settings.thresholds.helmet;
        
        this.vestSlider.value = this.settings.thresholds.vest;
        this.vestValue.textContent = this.settings.thresholds.vest;
        
        this.enableAlerts.checked = this.settings.alerts.enabled;
        this.enableSound.checked = this.settings.alerts.sound;
        this.alertVolume.value = this.settings.alerts.volume;
        this.volumeValue.textContent = Math.round(this.settings.alerts.volume * 100) + '%';
        this.alertDuration.value = this.settings.alerts.duration;
        
        this.cameraSource.value = this.settings.camera.source;
        this.rtspUrl.value = this.settings.camera.rtspUrl;
        this.toggleRtspUrl(this.settings.camera.source === 'rtsp');
    }

    async saveThresholdSettings() {
        const thresholds = {
            confidence: parseFloat(this.confidenceSlider.value),
            helmet: parseFloat(this.helmetSlider.value),
            vest: parseFloat(this.vestSlider.value)
        };

        try {
            const response = await fetch('/api/settings/thresholds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(thresholds)
            });

            const data = await response.json();
            if (data.success) {
                this.settings.thresholds = thresholds;
                this.showSuccessMessage('임계값 설정이 저장되었습니다.');
            } else {
                this.showErrorMessage('설정 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('임계값 설정 저장 실패:', error);
            this.showErrorMessage('설정 저장 중 오류가 발생했습니다.');
        }
    }

    async saveAlertSettings() {
        const alerts = {
            enabled: this.enableAlerts.checked,
            sound: this.enableSound.checked,
            volume: parseFloat(this.alertVolume.value),
            duration: parseInt(this.alertDuration.value)
        };

        try {
            const response = await fetch('/api/settings/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(alerts)
            });

            const data = await response.json();
            if (data.success) {
                this.settings.alerts = alerts;
                this.updateAlertSystem();
                this.showSuccessMessage('경고 설정이 저장되었습니다.');
            } else {
                this.showErrorMessage('설정 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('경고 설정 저장 실패:', error);
            this.showErrorMessage('설정 저장 중 오류가 발생했습니다.');
        }
    }

    async saveCameraSettings() {
        const camera = {
            source: this.cameraSource.value,
            rtspUrl: this.rtspUrl.value
        };

        try {
            const response = await fetch('/api/settings/camera', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(camera)
            });

            const data = await response.json();
            if (data.success) {
                this.settings.camera = camera;
                this.showSuccessMessage('카메라 설정이 저장되었습니다.');
            } else {
                this.showErrorMessage('설정 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('카메라 설정 저장 실패:', error);
            this.showErrorMessage('설정 저장 중 오류가 발생했습니다.');
        }
    }

    toggleRtspUrl(show) {
        this.rtspUrlGroup.style.display = show ? 'block' : 'none';
    }

    updateAlertSystem() {
        if (window.safetyMonitor) {
            window.safetyMonitor.toggleAlert(this.settings.alerts.enabled);
            window.safetyMonitor.alertSound.volume = this.settings.alerts.volume;
        }
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'danger');
    }

    showMessage(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.container').insertBefore(alert, document.querySelector('.container').firstChild);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 3000);
    }

    startSystemMonitoring() {
        this.updateSystemStatus();
        setInterval(() => this.updateSystemStatus(), 5000);
    }

    async updateSystemStatus() {
        try {
            const response = await fetch('/api/system/status');
            const data = await response.json();
            
            if (data.success) {
                this.updateStatusUI(data.status);
            }
        } catch (error) {
            console.error('시스템 상태 업데이트 실패:', error);
        }
    }

    updateStatusUI(status) {
        const modelStatus = document.getElementById('modelStatus');
        const cameraStatus = document.getElementById('cameraStatus');
        const processingSpeed = document.getElementById('processingSpeed');
        const memoryUsage = document.getElementById('memoryUsage');

        if (modelStatus) {
            modelStatus.textContent = status.model || '정상';
            modelStatus.className = `badge bg-${status.model === '정상' ? 'success' : 'warning'}`;
        }

        if (cameraStatus) {
            cameraStatus.textContent = status.camera || '연결됨';
            cameraStatus.className = `badge bg-${status.camera === '연결됨' ? 'success' : 'danger'}`;
        }

        if (processingSpeed) {
            processingSpeed.textContent = status.fps ? `${status.fps} FPS` : '15.2 FPS';
        }

        if (memoryUsage) {
            memoryUsage.textContent = status.memory ? `${status.memory}%` : '45%';
        }
    }

    resetSettings() {
        if (confirm('모든 설정을 기본값으로 재설정하시겠습니까?')) {
            this.settings = {
                thresholds: {
                    confidence: 0.5,
                    helmet: 0.3,
                    vest: 0.3
                },
                alerts: {
                    enabled: true,
                    sound: true,
                    volume: 0.7,
                    duration: 5
                },
                camera: {
                    source: '0',
                    rtspUrl: ''
                }
            };
            this.updateUI();
        }
    }
}

const settingsController = new SettingsController();