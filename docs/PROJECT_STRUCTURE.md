# 스마트팜 웹 서비스 — 프로젝트 구조

## 개요

기술 스택(Node.js, Next.js, Tailwind CSS, shadcn/ui, Supabase)과 진행 절차에 맞춘 **웹 앱 레포지토리** 폴더 구조 제안입니다.  
(아두이노 펌웨어·배선 문서는 별도 레포 또는 `hardware/` 등으로 분리 가능)

---

## 1. 루트 디렉터리 구조

```
01-Initial/                    # 프로젝트 루트 (또는 smartfarm-web)
├── app/                       # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── (auth)/                # 로그인·회원가입 그룹 (선택)
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/           # 대시보드·모니터링·제어
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── sensors/
│   │   ├── actuators/
│   │   └── settings/
│   ├── api/                   # API Routes
│   │   ├── sensor/
│   │   ├── actuator/
│   │   ├── mqtt/              # MQTT 프록시·웹훅 (필요 시)
│   │   └── auth/
│   └── not-found.tsx
├── components/
│   ├── ui/                    # shadcn/ui 컴포넌트
│   ├── layout/                # Header, Sidebar, Footer
│   ├── dashboard/             # 대시보드 전용 (카드, 차트, 센서/액추에이터 블록)
│   └── shared/                # 공통 (버튼, 모달 등)
├── lib/
│   ├── supabase/              # Supabase 클라이언트 (브라우저·서버)
│   ├── mqtt/                  # MQTT 유틸·토픽 상수 (서버용)
│   └── utils.ts               # 공통 유틸 (cn 등)
├── hooks/                     # React 훅 (useSensor, useActuator 등)
├── types/                     # 공통 타입 (sensor, actuator, farm)
├── config/                    # 앱 설정 (MQTT 토픽, Supabase env 이름)
├── docs/                      # 프로젝트 문서 (개요, 스택, 구조)
├── public/
├── .env.example               # NEXT_PUBLIC_*, SUPABASE_*, MQTT_* 등
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── components.json            # shadcn/ui 설정
├── package.json
└── README.md
```

---

## 2. 디렉터리별 역할

| 경로 | 역할 |
|------|------|
| **app/** | Next.js App Router. 페이지·레이아웃·API. `(dashboard)` 등 Route Groups로 URL 구조 분리 |
| **app/api/** | REST/API 엔드포인트. Supabase 조회·저장, MQTT 발행 프록시, 인증 콜백 등 |
| **components/ui/** | shadcn/ui에서 추가한 컴포넌트 (Button, Card, Input, Select 등) |
| **components/layout/** | 공통 레이아웃 (헤더, 사이드바, 푸터) |
| **components/dashboard/** | 대시보드 전용 (센서 카드, 액추에이터 제어 패널, 차트 래퍼) |
| **lib/supabase/** | `createClient` (브라우저/서버), 타입 생성 결과 활용 |
| **lib/mqtt/** | HiveMQ Cloud 연결·토픽 상수·발행/구독 헬퍼 (서버 전용) |
| **hooks/** | 센서 데이터 구독, 액추에이터 제어, Supabase Realtime 등 재사용 훅 |
| **types/** | 센서/액추에이터/팜 설정 등 공통 TypeScript 타입 |
| **config/** | 토픽 이름, 테이블 이름 등 설정 상수 (env와 분리) |
| **docs/** | PROJECT_OVERVIEW, TECH_STACK, PROJECT_STRUCTURE 등 |

---

## 3. 파일 네이밍 규칙

- **컴포넌트·페이지**: `PascalCase` (e.g. `SensorCard.tsx`, `page.tsx`)
- **유틸·훅·타입**: `camelCase` 또는 `kebab-case` (팀 통일) — 예: `utils.ts`, `useSensor.ts`, `sensor.ts`
- **설정**: `kebab-case` 또는 `camelCase` — 예: `mqtt-topics.ts`

---

## 4. 환경 변수 (예시)

`.env.example`에 넣을 항목 예시입니다. 실제 값은 `.env.local`에만 두고 Git에는 넣지 않습니다.

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # 서버 전용, 필요 시

# HiveMQ Cloud (서버용)
MQTT_BROKER_URL=
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=
```

---

## 5. 다음 단계

1. **1단계(환경·도구 준비)** 에서 위 구조로 Next.js 프로젝트 생성  
   - `create-next-app` + Tailwind + App Router  
   - shadcn/ui 초기화 (`npx shadcn-ui@latest init`)  
   - `docs/`, `config/`, `types/` 등 빈 폴더·파일 추가  
2. **2단계(DB 설계)** 이후 `lib/supabase/`, `types/` 에 생성된 스키마·타입 반영  
3. **4·5단계(MQTT·API)** 에서 `lib/mqtt/`, `app/api/` 구현  
4. **6단계(프론트)** 에서 `components/dashboard/`, `app/(dashboard)/` 채우기  

원하면 1단계부터 `create-next-app` 명령과 단계별 체크리스트를 같이 정리해 드리겠습니다.
