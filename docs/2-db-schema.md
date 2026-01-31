# 2단계 — 데이터 모델·DB 설계

**산출물**: Supabase 테이블·RLS, 마이그레이션, TypeScript 타입

---

## 1. 완료된 작업

- [x] Supabase 마이그레이션 적용 (`create_smartfarm_tables`)
- [x] TypeScript 타입 생성 (`lib/supabase/database.types.ts`)
- [x] 스키마 문서화

---

## 2. 테이블 정의

### 2.1 sensor_readings (센서 로그)

| 컬럼        | 타입         | 설명                    |
|-------------|--------------|-------------------------|
| id          | uuid (PK)    | 기본 키                 |
| created_at  | timestamptz  | 수집 시각               |
| temperature | numeric      | 온도 (°C)               |
| humidity    | numeric      | 습도 (%)                |
| ec          | numeric      | 전기전도도              |
| ph          | numeric      | pH                      |

- **용도**: F2, F3 — MQTT 수신 데이터 저장, 대시보드 조회
- **인덱스**: `idx_sensor_readings_created_at` (created_at DESC)

### 2.2 actuators (액추에이터 상태)

| 컬럼        | 타입        | 설명                    |
|-------------|-------------|-------------------------|
| id          | uuid (PK)   | 기본 키                 |
| code        | text (UNIQUE)| 코드 (led, pump, fan1, fan2) |
| display_name| text        | 표시명                  |
| is_on       | boolean     | 현재 on/off 상태        |
| updated_at  | timestamptz | 최종 업데이트 시각      |

- **초기 데이터**: led, pump, fan1, fan2 4행
- **용도**: F4, F5 — 제어 명령 반영, 상태 조회

### 2.3 farm_settings (팜 설정)

| 컬럼      | 타입        | 설명                    |
|-----------|-------------|-------------------------|
| id        | uuid (PK)   | 기본 키                 |
| key       | text (UNIQUE)| 설정 키                 |
| value     | jsonb       | 설정 값                 |
| updated_at| timestamptz | 최종 업데이트 시각      |

- **용도**: F6 — 팜/사용자 설정 저장·조회

---

## 3. RLS 정책

| 테이블          | anon | service_role   |
|-----------------|------|----------------|
| sensor_readings | SELECT | 전체        |
| actuators       | SELECT | 전체        |
| farm_settings   | SELECT | 전체        |

- **쓰기(INSERT/UPDATE/DELETE)**: service_role만 (API Routes에서 사용)
- **읽기(SELECT)**: anon 허용 (대시보드 클라이언트 직접 조회 가능)

---

## 4. 프로젝트 적용

- **마이그레이션**: Supabase MCP `apply_migration` 적용 완료
- **타입**: `lib/supabase/database.types.ts` — `Database`, `Tables<>`, `TablesInsert<>`, `TablesUpdate<>` export
- **Supabase 클라이언트**: `createClient<Database>()` 사용 시 타입 자동 적용

---

## 5. 다음 단계

**3단계**: 아두이노 R4 펌웨어 (센서 읽기, MQTT publish/subscribe, 액추에이터 제어)
