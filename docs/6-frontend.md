# 6단계 — 웹 프론트엔드 / 현재 프로젝트 반영

**산출물**: 대시보드·실시간 모니터링·제어 UI, 아두이노 10초 주기와 동기화, 구독 신청 버튼으로 MQTT 구독 스크립트 시작

---

## 1. 완료된 작업

- [x] **6단계** 웹 프론트엔드 — 대시보드·실시간 모니터링·제어 UI (`app/dashboard/page.tsx`, `components/dashboard/sensor-cards.tsx`, `actuator-panel.tsx`)
- [x] 센서 라인차트 (온도·습도·EC·pH 각각 별도) — `components/dashboard/sensor-chart.tsx`, **10초마다 갱신** (아두이노 10초 주기와 동일)
- [x] 센서 카드·차트 **10초 갱신** — 아두이노 실시간 값과 맞춤
- [x] `POST /api/sensor/ingest` — 센서 데이터 HTTP 수집
- [x] 대시보드 **구독 신청** 버튼 — 클릭 시 **같은 npm run dev 서버**가 MQTT 구독 스크립트를 자식 프로세스로 시작 (`npm run dev` 하나만 실행하면 됨, `components/dashboard/sensor-ingest-button.tsx`)
- [x] `npm run dev:all` — Next.js + MQTT 구독 스크립트 동시 실행 (선택)
- [x] 대시보드 경로 `/dashboard` (`app/dashboard/`)

---

## 2. API 스펙 (프론트엔드에서 사용)

### 2.1 센서

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/sensor` | 최근 센서 데이터 조회 (카드·차트) |
| POST | `/api/sensor/ingest` | 센서 데이터 수집 (HTTP, 스크립트 불필요) |

**POST /api/sensor/ingest body**

```json
{
  "temperature": 25.0,
  "humidity": 60.0,
  "ec": 1.2,
  "ph": 6.5
}
```

- `temperature`, `humidity`, `ec`, `ph` — 숫자, 최소 1개 필수. 아두이노/게이트웨이에서 이 API로 POST 하면 DB에 저장됨.

**GET /api/sensor Query**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| limit | number | 100 | 조회 건수 (최대 500) |

### 2.2 액추에이터

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/actuator` | 액추에이터 현재 상태 조회 |
| POST | `/api/actuator` | 액추에이터 제어 (MQTT + DB 반영) |

**POST body**: `{ "code": "led" | "pump" | "fan1" | "fan2", "is_on": boolean }`

---

## 3. 센서 데이터 수집 (명령어/스크립트 없이 가능)

- **HTTP 수집**: `POST /api/sensor/ingest` 에 `{ temperature?, humidity?, ec?, ph? }` 전송 → Supabase `sensor_readings` INSERT. 아두이노(WiFi)·게이트웨이·대시보드 **구독신청** 버튼에서 사용.
- **MQTT 수집 (선택)**: 아두이노가 MQTT만 사용할 때 `npm run mqtt:subscribe` 또는 `npm run dev:all` 로 구독 스크립트 실행 → MQTT 메시지마다 INSERT. (저장 조건: 메시지 올 때마다 INSERT, 값 변화 여부 무관.)

---

## 4. 흐름 요약

```
[센서 데이터 — HTTP]
POST /api/sensor/ingest → Supabase sensor_readings INSERT  (스크립트 불필요)

[센서 데이터 — MQTT, 선택]
아두이노 → MQTT publish (smartfarm/sensor/readings)
         → scripts/mqtt-subscriber.ts 구독
         → Supabase sensor_readings INSERT

[액추에이터 제어]
POST /api/actuator → MQTT publish (smartfarm/actuator/command)
                   → Supabase actuators UPDATE (is_on, updated_at)
                   → 아두이노 구독 후 하드웨어 제어
```

---

## 5. 배포·호스팅 (Vercel과 MQTT)

**요약: 대시보드를 구성하는 웹(화면·API)은 Vercel에서 그대로 실행됩니다.**  
Vercel에서 "실행이 안 되는 것"은 **MQTT 구독 스크립트** 하나뿐입니다.

| 구성요소 | Vercel에서 실행? | 비고 |
|----------|------------------|------|
| **웹 앱** (대시보드, 센서 카드·차트, 액추에이터 제어 UI) | ✅ 예 | 정상 배포·실행 |
| **API** (`GET/POST /api/sensor`, `POST /api/sensor/ingest`, `GET/POST /api/actuator`) | ✅ 예 | 요청 시 실행 |
| **MQTT 구독 스크립트** (아두이노 → MQTT → DB 저장) | ❌ 아니오 | "계속 연결 유지"하는 프로세스라 서버리스에서 불가 |

- **Vercel에 배포하면**: 대시보드, 센서 조회, 액추에이터 제어, HTTP 수집(`POST /api/sensor/ingest`) 모두 동작합니다.
- **MQTT로 아두이노 데이터를 받으려면**: MQTT 구독 스크립트를 **Railway·Render·VPS** 등 **항상 켜져 있는 서버**에서 `npm run mqtt:subscribe` 로 상시 실행하면 됩니다.
- **센서 저장**: (1) **HTTP** — `POST /api/sensor/ingest` 사용 시 Vercel만으로 충분. (2) **MQTT** 사용 시 위처럼 별도 서버에서 구독 스크립트만 돌리면 됨.
- **액추에이터 제어**: Vercel API Route에서 MQTT publish (요청 시 연결·발행·종료) → 정상 동작.

---

## 6. 검증 방법

### 6.1 센서 (구독 신청 버튼으로 스크립트 시작)

1. **터미널**: `npm run dev` 만 실행 (Next.js 서버 하나)
2. **대시보드** (`/dashboard`) → **구독 신청** 버튼 클릭 → 같은 dev 서버가 MQTT 구독 스크립트를 시작함. 아두이노 데이터가 10초마다 DB에 반영되고, 웹도 10초마다 갱신됨.
3. 대안: `npm run dev:all` (Next + MQTT 구독 동시 실행) 또는 `POST /api/sensor/ingest` 로 HTTP 수집.

### 6.2 센서 (HTTP 수집)

- `POST http://localhost:3000/api/sensor/ingest` body `{"temperature":25,"humidity":60,"ec":1.2,"ph":6.5}` 호출
- `GET http://localhost:3000/api/sensor?limit=10` 로 저장 확인

### 6.3 액추에이터

1. `GET http://localhost:3000/api/actuator` — 현재 상태 조회
2. `POST http://localhost:3000/api/actuator` body `{"code":"led","is_on":true}` — 제어
3. GET 재호출 시 `is_on` 변경 확인

---

## 7. 관련 문서

- [5-backend-api.md](./5-backend-api.md) — 백엔드/API 원본 스펙
- [PRD.md](./PRD.md), [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md), [2-db-schema.md](./2-db-schema.md)

---

## 8. SmartFarmWeb(GitHub) vs 06-Frontend 방식 차이

참조: [KevinCKS/SmartFarmWeb](https://github.com/KevinCKS/SmartFarmWeb) (smart-farm-web-phi.vercel.app)

| 구분 | SmartFarmWeb (GitHub 레포) | 06-Frontend (현재 프로젝트) |
|------|----------------------------|-----------------------------|
| **레포 구조** | 모노레포: `arduino/`, `mqtt/`, `supabase/`, `web/` — MQTT·웹·DB가 폴더 단위로 분리 | 단일 Next.js 앱: `app/`, `components/`, `lib/`, `scripts/` — 웹과 MQTT 스크립트가 같은 레포 |
| **DB 테이블** | `sensor_data`, `actuator_control`, `system_settings` | `sensor_readings`, `actuators`, `farm_settings` (스키마 변경 금지 규칙) |
| **웹 앱** | `web/` 하위 Next.js, Vercel 배포 (vercel.json) | 루트가 Next.js, Vercel 배포 대상 |
| **MQTT 위치** | `mqtt/` 폴더에 MQTT 관련 코드 분리 — 별도 서비스/스크립트로 운영 가능 | `scripts/mqtt-subscriber.ts`, `lib/mqtt/` — 같은 레포 안에서 스크립트로 실행 |
| **MQTT 구독 실행** | README: "Next.js 서버 실행" 후 "테스트 스크립트 실행" — MQTT를 어디서 상시 실행하는지 명시 안 됨 | **명시**: MQTT 구독은 **장기 실행 프로세스**이므로 Vercel 불가. 로컬: `npm run dev` + 구독 신청 버튼 또는 `dev:all`. 운영: Railway·Render·VPS 등에서 `mqtt:subscribe` 상시 실행 |
| **센서 수집 경로** | 2단계 "MQTT → DB 저장 로직" — MQTT 중심으로 서술 | MQTT + **HTTP 수집** (`POST /api/sensor/ingest`) 병행. 구독 신청 버튼으로 로컬에서 스크립트 spawn |
| **로컬 실행** | `cd web` → `npm run dev`, 별도 `test-mqtt-api.ps1` | `npm run dev` 한 번 → 대시보드에서 구독 신청 클릭으로 MQTT 구독 시작. 또는 `npm run dev:all` |
| **문서/단계** | 1단계 DB, 2단계 MQTT 데이터 흐름, 3단계 프론트엔드 UI | 5단계 백엔드/API, 6단계 프론트엔드 문서화. Vercel에서 웹·API만 실행, MQTT 구독은 별도 호스팅 필요하다고 명시 |

**요약**

- **SmartFarmWeb**: 모노레포·테이블명·폴더 구조가 다르고, MQTT 구독을 “어디서·어떻게 상시 실행하는지”는 README에 드러나지 않음. Vercel에 웹만 올려두고 MQTT는 `mqtt/`를 별도 서버에 올리는 구성일 수 있음.
- **06-Frontend**: MQTT 구독 스크립트는 **서버리스(Vercel)에서 불가**라고 전제하고, 로컬에서는 dev 서버가 버튼으로 스크립트를 띄우고, 운영에서는 Railway 등 **항상 켜진 서버**에서 `mqtt:subscribe`를 돌리라고 문서에 적어 둔 방식.

---

## 9. Vercel을 이용한 MQTT 대시보드 구독 방법 (참고)

참조: [Publish and Subscribe to Realtime Data on Vercel](https://vercel.com/guides/publish-and-subscribe-to-realtime-data-on-vercel)

Vercel 공식 가이드 요약:

- **서버리스 함수는 “구독”에 쓰지 말 것** — 실행 시간 제한·무상태이므로, 데이터 이벤트를 **구독(subscribe)** 하는 용도로 쓰면 안 됨.
- **권장 패턴**: **클라이언트(브라우저)** 가 구독하고, **서버리스 함수**는 **발행(publish)** 만 담당.

### Vercel만 쓸 때 MQTT 대시보드 구독 옵션

| 방식 | 설명 | DB 24/7 저장 |
|------|------|----------------|
| **A. 브라우저에서 MQTT 구독** | 대시보드(Next.js 클라이언트)가 HiveMQ Cloud에 WebSocket(wss)으로 직접 연결해 `smartfarm/sensor/readings` 구독. 수신한 값을 화면에 바로 표시. **구현됨**: `NEXT_PUBLIC_MQTT_*` 설정 시 `useSensorMqtt` 훅이 브라우저에서 구독·표시·수신 시 `POST /api/sensor/ingest` 호출(대시보드 열려 있을 때만 DB 저장). | 대시보드가 열려 있을 때만 DB 저장. 24시간 저장은 D방식 필요. |
| **B. 서버리스는 publish만** | 액추에이터 제어 등은 지금처럼 `POST /api/actuator`에서 MQTT publish. **센서 구독**은 서버에서 하지 않음. | ❌ 서버에서 구독 스크립트를 돌릴 수 없으므로, 센서 → DB 자동 저장은 불가. |
| **C. 실시간 전용 서비스** | Ably, Supabase Realtime, Pusher 등으로 실시간 푸시. 아두이노/게이트웨이가 해당 서비스로 전송하거나, 중간에 별도 서버가 MQTT → 해당 서비스로 전달. | 제공자·구성에 따름. |
| **D. 현재 방식** | 웹·API는 Vercel, **MQTT 구독 스크립트**는 Railway·Render·VPS 등에서 `mqtt:subscribe` 상시 실행 → 24시간 DB 저장. | ✅ 가능. |

**A방식 사용 방법 (구현됨)**  
1. `.env.local`에 `NEXT_PUBLIC_MQTT_BROKER_URL=wss://...`, `NEXT_PUBLIC_MQTT_USERNAME`, `NEXT_PUBLIC_MQTT_PASSWORD` 추가.  
2. 대시보드 새로고침 → 브라우저가 MQTT에 직접 연결. 아두이노 publish 시 실시간 표시.  
3. 수신 시 `POST /api/sensor/ingest` 호출로 DB 저장(대시보드가 열려 있을 때만).  
4. **주의**: `NEXT_PUBLIC_*` 는 브라우저에 노출되므로, HiveMQ 읽기 전용 계정 사용 권장.

**정리**: Vercel만으로 “서버에서 MQTT 구독해서 24시간 DB 저장”은 불가. **Vercel만 쓰려면** 브라우저에서 MQTT 구독(A) 또는 실시간 서비스(C)를 쓰고, **24시간 DB 저장**이 필요하면 별도 서버에서 구독 스크립트(D)를 돌려야 함.

---

## 10. 다음 단계

- **인증(로그인)**: Supabase Auth 연동, 대시보드 접근 권한 (`app/api/auth/` 확장)
- **배포·운영**: Vercel에 웹 배포 + MQTT 구독 스크립트는 Railway·Render·VPS 등에서 `npm run mqtt:subscribe` 상시 실행
- **설정·알림 UI**: `farm_settings` 테이블 기반 설정 화면, 임계치 알림(선택)
