class StreamController {
    constructor() {
        this.isStreaming = false;
        this.videoElement = null;
        this.startBtn = null;
        this.stopBtn = null;
        this.statusElement = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            this.setupEventListeners();
        });
    }

    setupElements() {
        this.videoElement = document.getElementById('videoFeed');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusElement = document.getElementById('streamStatus');
    }

    setupEventListeners() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startStream());
        }

        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopStream());
        }

        if (this.videoElement) {
            this.videoElement.addEventListener('load', () => this.onStreamLoad());
            this.videoElement.addEventListener('error', () => this.onStreamError());
        }
    }

    startStream() {
        if (!this.isStreaming) {
            this.isStreaming = true;
            this.updateStreamStatus('connecting');
            this.videoElement.src = '/video_feed?' + new Date().getTime();
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
        }
    }

    stopStream() {
        if (this.isStreaming) {
            this.isStreaming = false;
            this.updateStreamStatus('disconnected');
            this.videoElement.src = '';
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
        }
    }

    onStreamLoad() {
        this.updateStreamStatus('connected');
    }

    onStreamError() {
        this.updateStreamStatus('error');
        this.isStreaming = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
    }

    updateStreamStatus(status) {
        if (!this.statusElement) return;

        const statusConfig = {
            'connected': { class: 'bg-success', text: '연결됨' },
            'connecting': { class: 'bg-warning', text: '연결 중...' },
            'disconnected': { class: 'bg-secondary', text: '연결 끊김' },
            'error': { class: 'bg-danger', text: '오류 발생' }
        };

        const config = statusConfig[status] || statusConfig['disconnected'];
        this.statusElement.innerHTML = `<span class="badge ${config.class}">${config.text}</span>`;
    }

    refreshStream() {
        if (this.isStreaming) {
            this.videoElement.src = '/video_feed?' + new Date().getTime();
        }
    }
}

const streamController = new StreamController();