# 4단계 — MQTT(HiveMQ) 연동

**산출물**: 토픽 규칙, 연결 가이드, 웹/백엔드 구독·발행 구조

---

## 1. 완료된 작업

- [x] HiveMQ Cloud 토픽 규칙 정리
- [x] 웹/백엔드 MQTT 연결 가이드
- [x] `config/mqtt-topics.ts` — 토픽 상수
- [x] `lib/mqtt/client.ts` — 발행(publish) 유틸 (서버/API 전용)
- [x] `lib/mqtt/subscriber.ts` — 구독(subscribe) 유틸 (장기 실행 프로세스용)
- [x] `scripts/mqtt-subscriber.ts` — 센서 구독 스크립트 (5단계에서 Supabase 연동)

---

## 2. 토픽 규칙

3단계 아두이노 펌웨어와 동일. [3-arduino-firmware.md](./3-arduino-firmware.md) §5 참고.

| 방향 | 토픽 | payload | 비고 |
|------|------|---------|------|
| **publish** | `smartfarm/sensor/readings` | `{"temperature":25.0,"humidity":60.0,"ec":1.2,"ph":6.5}` | 아두이노 → 약 10초 주기 |
| **subscribe** | `smartfarm/sensor/readings` | 동일 | 웹/백엔드 구독 (DB 저장용) |
| **publish** | `smartfarm/actuator/command` | `{"code":"led","is_on":true}` | 웹 API → 아두이노 제어 |
| **subscribe** | `smartfarm/actuator/command` | 동일 | 아두이노 구독 |

- `code`: `led`, `pump`, `fan1`, `fan2` (DB `actuators.code`와 동일)

---

## 3. HiveMQ Cloud 연결 가이드

### 3.1 환경 변수

`.env.local`에 다음 설정 (참고: [1-env-setup.md](./1-env-setup.md) §4)

| 변수 | 설명 |
|------|------|
| `MQTT_BROKER_URL` | 8884: `wss://<cluster>.s1.eu.hivemq.cloud:8884/mqtt` / 8883: `mqtts://<cluster>.s1.eu.hivemq.cloud:8883` |
| `MQTT_USERNAME` | HiveMQ Cloud 사용자명 |
| `MQTT_PASSWORD` | HiveMQ Cloud 비밀번호 |
| `MQTT_CLIENT_ID` | 고유 클라이언트 ID (예: `smartfarm-web-api`, 아두이노와 중복 금지) |

- **8883**: MQTT over TCP+TLS (아두이노·Node.js). **8884**: MQTT over WebSocket+TLS (일부 플랜).

### 3.2 Node.js(mqtt) 연결 옵션

```ts
import mqtt from "mqtt";

const client = mqtt.connect(process.env.MQTT_BROKER_URL!, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: process.env.MQTT_CLIENT_ID ?? "smartfarm-web-api",
  clean: true,
  reconnectPeriod: 5000,
});
```

### 3.3 배포 환경 고려

- **Vercel(Serverless)**: 요청마다 연결·발행 후 종료 가능. `publish`만 사용 시 적합.
- **센서 구독**: 장기 연결 필요 → 별도 Node 프로세스(Railway, Render, VPS 등)에서 `scripts/mqtt-subscriber.ts` 실행. 5단계에서 Supabase 저장 연동.

---

## 4. 웹/백엔드 구독·발행 구조

```
config/mqtt-topics.ts     # 토픽 상수
lib/mqtt/
├── client.ts             # createClient(), publishActuatorCommand()
├── subscriber.ts         # runSensorSubscriber(onMessage)
scripts/
└── mqtt-subscriber.ts    # 장기 실행: 구독 → (5단계) Supabase 저장
```

### 4.1 발행 (API Route에서 사용)

```ts
import { publishActuatorCommand } from "@/lib/mqtt/client";

// POST /api/actuator 등에서
await publishActuatorCommand({ code: "led", is_on: true });
```

### 4.2 구독 (장기 실행 스크립트)

```bash
npx tsx scripts/mqtt-subscriber.ts
```

5단계에서 `onMessage` 콜백에 Supabase insert 로직 추가 예정.

---

## 5. 검증 방법

### 5.1 발행 테스트

1. `.env.local`에 MQTT 변수 설정
2. **방법 A (스크립트)**: `npm run mqtt:publish` 또는 `npm run mqtt:publish led true` (code, is_on)
3. **방법 B (API)**: `POST /api/actuator` body `{"code":"led","is_on":true}` (서버 실행 중 `npm run dev`)
4. HiveMQ Cloud Web Client에서 `smartfarm/actuator/command` 구독 후 메시지 수신 확인
5. 아두이노 연결 시 LED 동작 확인

### 5.2 구독 테스트

1. `npx tsx scripts/mqtt-subscriber.ts` 실행
2. 아두이노가 `smartfarm/sensor/readings`에 publish 시 스크립트 콘솔에 payload 출력 확인

---

## 6. 다음 단계

**5단계**: 백엔드/API — Vercel Functions로 HiveMQ Cloud ↔ Supabase 연동, 센서 데이터 저장·액추에이터 제어 API
