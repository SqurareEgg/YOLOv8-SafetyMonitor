from flask import Flask, render_template, request, jsonify, Response, make_response
import os
import cv2
from ultralytics import YOLO
import numpy as np
from datetime import datetime
import json
from werkzeug.utils import secure_filename
import uuid
import csv
from io import StringIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'

# 업로드 폴더 생성
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# YOLOv8 모델 로드
model = YOLO('yolov8n.pt')

# 웹캠 객체
camera = None

# 전역 변수
detection_logs = []
settings = {
    'confidence': 0.5,
    'nms_threshold': 0.4,
    'enable_alerts': True,
    'alert_classes': ['person', 'helmet', 'vest', 'car', 'license_plate']
}

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'mkv'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_camera():
    global camera
    if camera is None:
        camera = cv2.VideoCapture(0)
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    return camera


def generate_frames():
    global detection_logs, settings

    while True:
        camera = get_camera()
        success, frame = camera.read()
        if not success:
            break

        # YOLOv8 추론
        results = model(frame, conf=settings['confidence'])

        # 감지 결과 처리
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # 바운딩 박스 좌표
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = box.conf[0].cpu().numpy()
                    cls = int(box.cls[0].cpu().numpy())

                    # 클래스 이름
                    class_name = model.names[cls]

                    # 바운딩 박스 그리기
                    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                    cv2.putText(frame, f'{class_name} {conf:.2f}',
                                (int(x1), int(y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                    # 로그 추가
                    log_entry = {
                        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'class': class_name,
                        'confidence': float(conf),
                        'bbox': [int(x1), int(y1), int(x2), int(y2)]
                    }
                    detection_logs.append(log_entry)

                    # 로그 개수 제한
                    if len(detection_logs) > 100:
                        detection_logs.pop(0)

        # 프레임 인코딩
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


def process_uploaded_file(filepath, filename):
    global detection_logs, settings

    try:
        # 이미지인지 비디오인지 확인
        file_ext = filename.split('.')[-1].lower()

        if file_ext in ['png', 'jpg', 'jpeg', 'gif']:
            # 이미지 처리
            return process_image(filepath, filename)
        elif file_ext in ['mp4', 'avi', 'mov', 'mkv']:
            # 비디오 처리
            return process_video(filepath, filename)
        else:
            return {'status': 'error', 'message': 'Unsupported file format'}

    except Exception as e:
        return {'status': 'error', 'message': f'Processing failed: {str(e)}'}


def process_image(filepath, filename):
    # 이미지 로드
    image = cv2.imread(filepath)
    if image is None:
        return {'status': 'error', 'message': 'Failed to load image'}

    # YOLO 추론
    results = model(image, conf=settings['confidence'])

    detections = []
    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = box.conf[0].cpu().numpy()
                cls = int(box.cls[0].cpu().numpy())
                class_name = model.names[cls]

                # 바운딩 박스 그리기
                cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                cv2.putText(image, f'{class_name} {conf:.2f}',
                            (int(x1), int(y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                detections.append({
                    'class': class_name,
                    'confidence': float(conf),
                    'bbox': [int(x1), int(y1), int(x2), int(y2)]
                })

    # 결과 이미지 저장
    result_filename = f"result_{filename}"
    result_path = os.path.join(app.config['UPLOAD_FOLDER'], result_filename)
    cv2.imwrite(result_path, image)

    return {
        'status': 'success',
        'message': f'Detected {len(detections)} objects',
        'detections': detections,
        'original_file': filename,
        'result_file': result_filename
    }


def process_video(filepath, filename):
    cap = cv2.VideoCapture(filepath)
    if not cap.isOpened():
        return {'status': 'error', 'message': 'Failed to load video'}

    # 비디오 정보
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # 결과 비디오 설정
    result_filename = f"result_{filename}"
    result_path = os.path.join(app.config['UPLOAD_FOLDER'], result_filename)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(result_path, fourcc, fps, (width, height))

    total_detections = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # YOLO 추론
        results = model(frame, conf=settings['confidence'])

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = box.conf[0].cpu().numpy()
                    cls = int(box.cls[0].cpu().numpy())
                    class_name = model.names[cls]

                    # 바운딩 박스 그리기
                    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                    cv2.putText(frame, f'{class_name} {conf:.2f}',
                                (int(x1), int(y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                    total_detections += 1

        out.write(frame)

    cap.release()
    out.release()

    return {
        'status': 'success',
        'message': f'Processed video with {total_detections} total detections',
        'original_file': filename,
        'result_file': result_filename
    }


# 메인 라우트들
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/about')
def about_page():
    return render_template('about.html')


# 비디오 피드 라우트
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


# 감지 로그 라우트들
@app.route('/detection_log')
def detection_log():
    # 최근 20개 로그만 반환
    recent_logs = detection_logs[-20:] if len(detection_logs) > 20 else detection_logs
    return jsonify({
        'logs': recent_logs,
        'total_count': len(detection_logs),
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })


@app.route('/detection_log/clear', methods=['POST'])
def clear_detection_log():
    global detection_logs
    detection_logs.clear()
    return jsonify({'status': 'success', 'message': 'Logs cleared'})


@app.route('/detection_log/export')
def export_detection_log():
    # CSV 형태로 로그 내보내기
    output = StringIO()
    writer = csv.writer(output)

    # 헤더 작성
    writer.writerow(['Timestamp', 'Class', 'Confidence', 'BBox_X1', 'BBox_Y1', 'BBox_X2', 'BBox_Y2'])

    # 로그 데이터 작성
    for log in detection_logs:
        writer.writerow([
            log['timestamp'],
            log['class'],
            log['confidence'],
            log['bbox'][0],
            log['bbox'][1],
            log['bbox'][2],
            log['bbox'][3]
        ])

    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers[
        'Content-Disposition'] = f'attachment; filename=detection_log_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'

    return response


@app.route('/logs')
def logs_page():
    return render_template('logs.html')


# 설정 관련 라우트들
@app.route('/settings', methods=['GET', 'POST'])
def settings_handler():
    global settings

    if request.method == 'GET':
        return render_template('settings.html', settings=settings)

    elif request.method == 'POST':
        # 폼 데이터 받기
        settings['confidence'] = float(request.form.get('confidence', 0.5))
        settings['nms_threshold'] = float(request.form.get('nms_threshold', 0.4))
        settings['enable_alerts'] = request.form.get('enable_alerts') == 'on'

        # 알림 클래스 설정
        alert_classes = request.form.getlist('alert_classes')
        settings['alert_classes'] = alert_classes if alert_classes else []

        return jsonify({
            'status': 'success',
            'message': 'Settings updated successfully',
            'settings': settings
        })


@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    global settings

    if request.method == 'GET':
        return jsonify(settings)

    elif request.method == 'POST':
        data = request.get_json()

        if 'confidence' in data:
            settings['confidence'] = float(data['confidence'])
        if 'nms_threshold' in data:
            settings['nms_threshold'] = float(data['nms_threshold'])
        if 'enable_alerts' in data:
            settings['enable_alerts'] = bool(data['enable_alerts'])
        if 'alert_classes' in data:
            settings['alert_classes'] = data['alert_classes']

        return jsonify({
            'status': 'success',
            'message': 'Settings updated',
            'settings': settings
        })


@app.route('/settings/reset', methods=['POST'])
def reset_settings():
    global settings

    # 기본값으로 리셋
    settings = {
        'confidence': 0.5,
        'nms_threshold': 0.4,
        'enable_alerts': True,
        'alert_classes': ['person', 'helmet', 'vest', 'car', 'license_plate']
    }

    return jsonify({
        'status': 'success',
        'message': 'Settings reset to default',
        'settings': settings
    })


# 업로드 관련 라우트들
@app.route('/upload', methods=['GET', 'POST'])
def upload_handler():
    if request.method == 'GET':
        return render_template('upload.html')

    elif request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file selected'})

        file = request.files['file']
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'})

        if file and allowed_file(file.filename):
            # 고유한 파일명 생성
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)

            file.save(filepath)

            # YOLO 추론 실행
            result = process_uploaded_file(filepath, unique_filename)

            return jsonify(result)
        else:
            return jsonify({'status': 'error', 'message': 'Invalid file type'})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)