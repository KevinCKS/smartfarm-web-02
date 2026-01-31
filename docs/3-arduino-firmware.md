# 3단계 — 아두이노 R4 펌웨어

**산출물**: 펌웨어 코드, 배선·설정 문서

---

## 1. 완료된 작업

- [x] 아두이노 우노 R4 WiFi 펌웨어 스케치 (`firmware/SmartfarmR4/SmartfarmR4.ino`)
- [x] 센서 주기 수집·MQTT publish (F1)
- [x] 제어 토픽 구독·액추에이터 제어 (F5)
- [x] 배선·설정·토픽 규칙 문서화

---

## 2. 보드·라이브러리

| 항목 | 내용 |
|------|------|
| **보드** | Arduino Uno R4 WiFi (WiFiS3, WiFiSSLClient 사용) |
| **비고** | R4 Minima 사용 시 Ethernet Shield + PubSubClient + Ethernet 라이브러리로 별도 수정 필요 |
| **라이브러리** | PubSubClient (Nick O'Leary), ArduinoJson (Benoit Blanchon), DHT sensor library (Adafruit) — Library Manager에서 설치 |

---

## 3. 설정 (스케치 업로드 전)

`firmware/SmartfarmR4/arduino_secrets.h`에서 WiFi·MQTT 값을 정의한다.  
(참조: `.env.local`의 MQTT_BROKER_URL에서 호스트만 추출, MQTT_USERNAME/MQTT_PASSWORD 동일 사용.)  
`arduino_secrets.h`는 `.gitignore`에 포함되어 Git에 커밋되지 않는다.

| 상수 | 설명 |
|------|------|
| `WIFI_SSID` / `WIFI_PASS` | WiFi SSID·비밀번호 |
| `MQTT_BROKER_HOST` | HiveMQ Cloud 호스트 (포트 제외) |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | HiveMQ Cloud 인증 |

- 포트: 아두이노는 **8883** (MQTT over TCP+TLS) 사용. 8884(WebSocket)는 아두이노 미지원.
- Client ID: 스케치 기본값 `smartfarm-arduino`. 동일 브로커에서 여러 장치 시 각자 고유 값 사용.

---

## 4. 핀·배선

### 4.1 센서

| 용도 | 핀 | 비고 |
|------|-----|------|
| 온도·습도 | D7 | DHT11 (Adafruit DHT library) |
| EC | A2 | TODO: 실제 EC 센서·보정 적용 |
| pH | A3 | TODO: pH 프로브·앰프 보정 적용 |

### 4.2 액추에이터 (디지털 출력)

| 코드 | 기본 핀 | 설명 |
|------|--------|------|
| led | D2 | 식물성장 LED (릴레이/모스펫 제어) |
| pump | D3 | 양액 펌프 |
| fan1 | D4 | 팬 1 |
| fan2 | D5 | 팬 2 |

HIGH = ON, LOW = OFF. 실제 부하는 릴레이 모듈 또는 모스펫으로 구동하고, 아두이노 핀은 제어 신호만 출력한다.

---

## 5. MQTT 토픽 규칙 (4단계·5단계와 동일)

| 방향 | 토픽 | payload 예시 | 비고 |
|------|------|---------------|------|
| **publish** | `smartfarm/sensor/readings` | `{"temperature":25.0,"humidity":60.0,"ec":1.2,"ph":6.5}` | 10초 주기 (스케치에서 변경 가능) |
| **subscribe** | `smartfarm/actuator/command` | `{"code":"led","is_on":true}` | code: `led`, `pump`, `fan1`, `fan2` (DB `actuators.code`와 동일) |

---

## 6. 빌드·업로드

1. Arduino IDE 2.x에서 **보드**: Arduino Uno R4 WiFi 선택.
2. **스케치** 열기: `firmware/SmartfarmR4/SmartfarmR4.ino`.
3. 위 설정 값 수정 후 **검증** → **업로드**.
4. 시리얼 모니터 115200 baud로 WiFi·MQTT 연결 및 센서 publish 로그 확인.

---

## 7. 검증 방법

위 내용(펌웨어·설정·토픽)이 올바르게 동작하는지 아래 순서로 확인한다.

### 7.1 컴파일·업로드

1. Arduino IDE에서 **검증(컴파일)** → 에러 없이 완료되는지 확인.
2. **업로드** → 보드에 정상 업로드되는지 확인.

### 7.2 시리얼 모니터 (115200 baud)

1. **WiFi**: `WiFi connecting` → `WiFi connected` 출력 확인.
2. **MQTT**: `MQTT connecting...` → `connected` 출력 확인.
3. **센서 publish**: 약 10초마다 `Published sensor readings` 출력 확인.
4. DHT11 미연결 시 온·습도가 `NaN`이면 0.0으로 publish됨. 연결 시 실값 확인.

### 7.3 MQTT 메시지 확인 (HiveMQ Cloud 또는 MQTT 클라이언트)

1. [HiveMQ Cloud](https://console.hivemq.cloud) 로그인 → **Web Client** 또는 **MQTT Client** 사용.
2. `.env.local`과 동일한 **Broker URL**(호스트·포트 8883 또는 8884), **Username**, **Password**로 연결.
3. **Subscribe** 토픽: `smartfarm/sensor/readings`  
   → 약 10초마다 `{"temperature":...,"humidity":...,"ec":...,"ph":...}` 수신되는지 확인.
4. **Publish** 토픽: `smartfarm/actuator/command`  
   → payload 예: `{"code":"led","is_on":true}` 전송 시 아두이노가 해당 액추에이터를 켜는지 확인 (시리얼 로그 없어도 릴레이/LED 동작으로 확인 가능).

### 7.4 체크리스트 요약

| 항목 | 확인 방법 |
|------|-----------|
| 컴파일 | Arduino IDE 검증 통과 |
| WiFi | 시리얼에 `WiFi connected` |
| MQTT 연결 | 시리얼에 `MQTT ... connected` |
| 센서 publish | MQTT 클라이언트에서 `smartfarm/sensor/readings` 수신 |
| 액추에이터 제어 | `smartfarm/actuator/command`에 JSON publish 시 LED/펌프/팬 동작 |

---

## 8. 다음 단계

**5단계**: 백엔드/API — Vercel Functions로 HiveMQ Cloud ↔ Supabase 연동, 인증·권한

(4단계 완료: [4-mqtt-hivemq.md](./4-mqtt-hivemq.md))

---

*펌웨어는 PRD F1·F5 및 [2-db-schema.md](./2-db-schema.md)의 `actuators.code`(led, pump, fan1, fan2)와 맞춰 두었으며, Supabase 스키마는 변경하지 않음.*
