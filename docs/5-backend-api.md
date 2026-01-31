# 5단계 — 백엔드/API

**산출물**: MQTT ↔ Supabase 연동, 센서 데이터 저장·조회 API, 액추에이터 제어·상태 API

---

## 1. 완료된 작업

- [x] Supabase service_role 클라이언트 (`lib/supabase/server.ts`)
- [x] MQTT 센서 구독 → Supabase `sensor_readings` insert (`scripts/mqtt-subscriber.ts`)
- [x] `GET /api/sensor` — 센서 데이터 조회 (대시보드용)
- [x] `GET /api/actuator` — 액추에이터 상태 조회 (대시보드용)
- [x] `POST /api/actuator` — 액추에이터 제어 (MQTT publish + Supabase `actuators` update)

---

## 2. API 스펙

### 2.1 센서

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/sensor` | 최근 센서 데이터 조회 |

**Query**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| limit | number | 100 | 조회 건수 (최대 500) |

**응답 예시**

```json
[
  {
    "id": "uuid",
    "created_at": "2025-02-01T12:00:00Z",
    "temperature": 25.0,
    "humidity": 60.0,
    "ec": 1.2,
    "ph": 6.5
  }
]
```

### 2.2 액추에이터

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/actuator` | 액추에이터 현재 상태 조회 |
| POST | `/api/actuator` | 액추에이터 제어 (MQTT + DB 반영) |

**POST body**

```json
{
  "code": "led",
  "is_on": true
}
```

- `code`: `led` | `pump` | `fan1` | `fan2`
- `is_on`: boolean (기본 true)

**GET 응답 예시**

```json
[
  {
    "id": "uuid",
    "code": "led",
    "display_name": "식물성장 LED",
    "is_on": false,
    "updated_at": "2025-02-01T12:00:00Z"
  }
]
```

---

## 3. MQTT ↔ Supabase 연동 흐름

```
[센서 데이터]
아두이노 → MQTT publish (smartfarm/sensor/readings)
         → scripts/mqtt-subscriber.ts 구독
         → Supabase sensor_readings INSERT

[액추에이터 제어]
POST /api/actuator → MQTT publish (smartfarm/actuator/command)
                   → Supabase actuators UPDATE (is_on, updated_at)
                   → 아두이노 구독 후 하드웨어 제어
```

---

## 4. 배포 고려사항

| 구성요소 | 호스팅 | 비고 |
|----------|--------|------|
| Next.js API (sensor, actuator) | Vercel | Serverless, 요청 시 실행 |
| MQTT 구독 스크립트 | Railway, Render, VPS 등 | 장기 실행 프로세스, Vercel 불가 |

- **센서 저장**: `npm run mqtt:subscribe`를 별도 서비스에서 상시 실행
- **액추에이터 제어**: Vercel API Route에서 MQTT publish (요청별 연결·종료)

---

## 5. 검증 방법

### 5.1 센서 API

1. `npm run mqtt:subscribe` 실행 (Supabase 저장 활성화)
2. 아두이노 또는 `scripts/test-publish-actuator.ts` 대신 sensor publish 스크립트로 데이터 발행
3. `GET http://localhost:3000/api/sensor?limit=10` 호출 후 DB 저장 확인

### 5.2 액추에이터 API

1. `GET http://localhost:3000/api/actuator` — 현재 상태 조회
2. `POST http://localhost:3000/api/actuator` body `{"code":"led","is_on":true}` — 제어
3. GET 재호출 시 `is_on` 변경 확인

---

## 6. 다음 단계

**6단계**: 웹 프론트엔드 — 대시보드, 실시간 모니터링, 제어 UI
