# 📌 포트폴리오 요약

- **기간**: 2025-07-08 (하루 업로드)
- **인원**:
- **담당 역할**:

## 1. 프로젝트 개요 (Overview)

YOLOv8 기반 실시간 객체 탐지 웹 애플리케이션입니다. 웹캠 스트리밍, 이미지/영상 업로드 분석을 지원하며, 사람·안전모(helmet)·조끼(vest)·차량·번호판 등을 탐지해 공사현장 안전 모니터링이나 차량 감시 용도로 활용할 수 있도록 만들었습니다. (한이음 ICT 멘토링용으로 제작)

## 2. 기술 스택 (Tech Stack)

- Python, Flask
- YOLOv8 (Ultralytics), OpenCV, PyTorch
- Jinja2 템플릿 + 바닐라 JS (실시간 스트리밍/설정 UI)

## 3. 핵심 기능 및 담당 구현 사항 (Key Features & Contributions)

- `/video_feed`: 웹캠 프레임을 실시간으로 YOLOv8 추론 후 MJPEG 스트리밍
- `/upload`: 이미지·영상 업로드 후 객체 탐지 결과 반환
- `/detection_log`, `/detection_log/export`: 탐지 기록 조회 및 CSV 내보내기
- `/settings`: 신뢰도(confidence)·NMS 임계값, 경보 대상 클래스(사람/안전모/조끼/차량/번호판) 설정

## 4. 트러블슈팅 및 문제 해결 (Troubleshooting)

- 사전학습 가중치(`yolov8n.pt`, 6.5MB)와 `.idea` 설정 폴더가 소스코드와 함께 커밋되어 있던 것을 정리했습니다. `yolov8n.pt`는 Ultralytics 라이브러리가 최초 실행 시 자동 다운로드하므로 저장소에 포함할 필요가 없어 `.gitignore`로 제외했습니다.
- 레포 이름이 프로젝트 내용과 무관한 `IOS`로 되어 있던 것을 `yolov8-safety-monitor`로 변경했습니다.

## 5. 실행 방법 (How to Run)

```sh
pip install -r requirements.txt
python app.py
```

- 최초 실행 시 `yolov8n.pt` 가중치가 자동 다운로드됩니다.
- 기본 포트: `5000`

## 6. 성과 및 회고 (Results & Retrospective)

- (작성 예정)
