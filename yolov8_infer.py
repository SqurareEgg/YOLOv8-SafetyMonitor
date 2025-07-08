import cv2
import numpy as np
from ultralytics import YOLO
import torch
from datetime import datetime
import os


class YOLOv8Detector:
    def __init__(self, model_path='yolov8n.pt', device='auto'):
        self.model = YOLO(model_path)
        self.device = device
        self.class_names = self.model.names

    def detect_objects(self, image, conf_threshold=0.5, nms_threshold=0.4):
        """단일 이미지에서 객체 감지"""
        results = self.model(image, conf=conf_threshold, iou=nms_threshold)
        detections = []

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = box.conf[0].cpu().numpy()
                    cls = int(box.cls[0].cpu().numpy())

                    detection = {
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'confidence': float(conf),
                        'class_id': cls,
                        'class_name': self.class_names[cls]
                    }
                    detections.append(detection)

        return detections

    def draw_detections(self, image, detections, thickness=2):
        """감지 결과를 이미지에 그리기"""
        for detection in detections:
            bbox = detection['bbox']
            conf = detection['confidence']
            class_name = detection['class_name']

            # 바운딩 박스 색상 설정
            color = self.get_class_color(detection['class_id'])

            # 바운딩 박스 그리기
            cv2.rectangle(image, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, thickness)

            # 텍스트 배경
            text = f'{class_name} {conf:.2f}'
            text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            cv2.rectangle(image, (bbox[0], bbox[1] - text_size[1] - 4),
                          (bbox[0] + text_size[0], bbox[1]), color, -1)

            # 텍스트 그리기
            cv2.putText(image, text, (bbox[0], bbox[1] - 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        return image

    def get_class_color(self, class_id):
        """클래스별 색상 반환"""
        colors = [
            (255, 0, 0),  # 빨강
            (0, 255, 0),  # 초록
            (0, 0, 255),  # 파랑
            (255, 255, 0),  # 노랑
            (255, 0, 255),  # 마젠타
            (0, 255, 255),  # 시안
            (128, 0, 128),  # 보라
            (255, 165, 0),  # 오렌지
        ]
        return colors[class_id % len(colors)]

    def process_frame(self, frame, settings):
        """프레임 처리 및 감지 결과 반환"""
        detections = self.detect_objects(
            frame,
            conf_threshold=settings['confidence'],
            nms_threshold=settings['nms_threshold']
        )

        # 감지 결과 그리기
        annotated_frame = self.draw_detections(frame.copy(), detections)

        return annotated_frame, detections

    def filter_detections(self, detections, alert_classes):
        """알림 대상 클래스만 필터링"""
        if not alert_classes:
            return detections

        filtered = []
        for detection in detections:
            if detection['class_name'] in alert_classes:
                filtered.append(detection)

        return filtered

    def create_detection_log(self, detections, timestamp=None):
        """감지 결과를 로그 형태로 변환"""
        if timestamp is None:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        logs = []
        for detection in detections:
            log_entry = {
                'timestamp': timestamp,
                'class': detection['class_name'],
                'confidence': detection['confidence'],
                'bbox': detection['bbox']
            }
            logs.append(log_entry)

        return logs


def load_model(model_path='yolov8n.pt'):
    """YOLO 모델 로드"""
    try:
        model = YOLO(model_path)
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None


def get_available_cameras():
    """사용 가능한 카메라 목록 반환"""
    cameras = []
    for i in range(10):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            cameras.append(i)
            cap.release()
    return cameras


def validate_image(image_path):
    """이미지 파일 유효성 검사"""
    if not os.path.exists(image_path):
        return False, "File not found"

    try:
        image = cv2.imread(image_path)
        if image is None:
            return False, "Invalid image format"
        return True, "Valid image"
    except Exception as e:
        return False, f"Error reading image: {e}"


def validate_video(video_path):
    """비디오 파일 유효성 검사"""
    if not os.path.exists(video_path):
        return False, "File not found"

    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return False, "Invalid video format"
        cap.release()
        return True, "Valid video"
    except Exception as e:
        return False, f"Error reading video: {e}"


def calculate_fps(start_time, frame_count):
    """FPS 계산"""
    elapsed_time = datetime.now() - start_time
    if elapsed_time.total_seconds() > 0:
        return frame_count / elapsed_time.total_seconds()
    return 0