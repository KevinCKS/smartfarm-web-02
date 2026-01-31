# PRD — 스마트팜 웹 서비스

**Product Requirements Document**

| 항목 | 내용 |
|------|------|
| 문서 버전 | 0.1 |
| 최종 수정 | 2025-02-01 |
| 관련 문서 | [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md), [TECH_STACK.md](./TECH_STACK.md), [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) |

---

## 1. 제품 개요

### 1.1 비전

스마트팜 현장의 **센서 데이터를 수집·저장**하고, **액추에이터를 원격 제어**할 수 있는 웹 서비스를 제공한다.  
아두이노 우노 R4와 MQTT를 통해 현장과 웹을 연결하고, Supabase에 데이터를 저장하며, Vercel에 배포된 웹앱으로 모니터링·제어를 수행한다.

### 1.2 목표

- **모니터링**: 온도·습도·EC·pH 등 센서 값을 실시간/히스토리로 확인
- **제어**: 식물성장 LED, 양액 펌프, 팬 2개를 웹에서 온/오프 제어
- **데이터 보존**: 센서 로그·설정을 Supabase에 저장
- **배포·운영**: GitHub 버전관리, Vercel 자동 배포로 안정적 운영

### 1.3 사용자(가정)

- **팜 운영자**: 대시보드에서 센서 확인·액추에이터 제어
- (선택) **다중 사용자**: Supabase Auth로 로그인·권한 분리

---

## 2. 범위

### 2.1 In Scope

- 센서 4종(온도, 습도, EC, pH) 데이터 수집·저장·표시
- 액추에이터 4종(LED, 양액 펌프, 팬 2개) 원격 제어
- 아두이노 우노 R4 기반 현장 제어·MQTT 연동
- HiveMQ Cloud를 이용한 MQTT 통신
- Supabase를 이용한 DB·(선택) 인증
- Next.js 웹앱(대시보드·API)·Vercel 배포
- GitHub를 이용한 소스 버전관리·배포 연동

### 2.2 Out of Scope (현 단계)

- 모바일 전용 앱 개발
- 복수 팜/멀티 테넌트 고도화 (필요 시 추후 확장)
- 아두이노 이외의 다른 하드웨어 플랫폼

---

## 3. 요구사항

### 3.1 하드웨어·현장

| 구분 | 내용 |
|------|------|
| **보드** | 아두이노 우노 R4 |
| **센서** | 온도, 습도, EC, pH |
| **액추에이터** | 식물성장 LED, 양액 펌프, 팬 2개 |
| **통신** | MQTT (HiveMQ Cloud) |

### 3.2 기능 요구사항 (요약)

| ID | 요구사항 | 비고 |
|----|----------|------|
| F1 | 센서 값 주기적 수집·MQTT publish | 아두이노 펌웨어 |
| F2 | MQTT 메시지 수신·Supabase 저장 | 웹/API 또는 백엔드 |
| F3 | 저장된 센서 데이터 조회·대시보드 표시 | 웹 프론트 |
| F4 | 액추에이터 제어 명령 MQTT publish | 웹 → API → MQTT |
| F5 | 아두이노가 제어 토픽 구독·액추에이터 동작 | 아두이노 펌웨어 |
| F6 | 팜/사용자 설정 저장·조회 | Supabase |
| F7 | (선택) 로그인·회원가입 | Supabase Auth |

### 3.3 비기능 요구사항 (요약)

- **가용성**: Vercel·HiveMQ Cloud·Supabase SLA 범위 내 동작
- **보안**: MQTT·Supabase·API 인증/권한 적용, 환경 변수로 비밀 노출 방지
- **유지보수**: GitHub 버전관리, 문서화(PRD·개요·스택·구조) 유지

---

## 4. 시스템 아키텍처

### 4.1 블록다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           스마트팜 웹 서비스 구조                              │
└─────────────────────────────────────────────────────────────────────────────┘

  [ 현장층 ]              [ 제어층 ]           [ 통신층 ]        [ 앱/데이터층 ]

  ┌──────────┐
  │ 센서     │  온도, 습도     ┌─────────────┐      ┌─────────────────┐
  │ EC, pH   │ ──────────────► │ 아두이노     │      │ HiveMQ Cloud    │
  └──────────┘                 │ 우노 R4     │◄────►│ (MQTT Broker)   │
                               └─────┬──────┘      └────────┬────────┘
  ┌──────────┐                       │                     │
  │ 액추에이터│  LED, 펌프     ◄──────┘     publish/subscribe│
  │ 팬 x2    │  제어 신호                                   │
  └──────────┘                                              ▼
                                              ┌─────────────────────┐
                                              │  GitHub             │
                                              │  · 소스/버전 관리   │
                                              │  · push → Vercel 배포│
                                              └──────────┬──────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────────┐
                                              │  웹앱 (Vercel)      │
                                              │  · 대시보드/모니터링  │
                                              │  · 제어 UI / API     │
                                              └──────────┬──────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────────┐
                                              │  Supabase (DB)      │
                                              │  · 센서 로그/설정   │
                                              └─────────────────────┘
```

### 4.2 데이터·배포 흐름

- **센서 → DB**: 센서 → 아두이노 → MQTT publish → HiveMQ Cloud → 웹/API 구독 → Supabase 저장
- **제어**: 웹 UI → API → MQTT publish → HiveMQ Cloud → 아두이노 구독 → 액추에이터 제어
- **배포·버전**: 소스 코드 → GitHub (push) → Vercel 자동 배포

---

## 5. 기술 스택

### 5.1 정의된 스택

| 분류 | 기술 | 용도 |
|------|------|------|
| 런타임 | Node.js | 서버·빌드·API (20.x LTS 권장) |
| 프레임워크 | Next.js | 풀스택 웹앱, App Router, API Routes |
| 버전관리 | Git | 소스 버전 관리 |
| 스타일 | Tailwind CSS | 유틸리티 CSS, 반응형·테마 |
| UI 컴포넌트 | shadcn/ui | 재사용 UI (Tailwind 기반) |
| DB·백엔드 | Supabase | PostgreSQL, Auth, Realtime 등 |

### 5.2 인프라·외부 서비스

| 분류 | 기술 | 용도 |
|------|------|------|
| MQTT | HiveMQ Cloud | 센서/액추에이터 MQTT 브로커 |
| 호스팅 | Vercel | Next.js 배포, Serverless Functions |
| 저장소 | GitHub | Git 원격 저장소, push → Vercel 연동 |

---

## 6. 프로젝트 구조 (요약)

웹 앱 레포지토리 기준 제안 구조. 상세는 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) 참고.

```
01-Initial/                    # 프로젝트 루트
├── app/                       # Next.js App Router
│   ├── (dashboard)/           # 대시보드·모니터링·제어
│   ├── api/                   # API Routes (sensor, actuator, mqtt, auth)
│   └── ...
├── components/
│   ├── ui/                    # shadcn/ui
│   ├── layout/
│   ├── dashboard/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── mqtt/
│   └── utils.ts
├── hooks/
├── types/
├── config/
├── docs/                      # PRD, 개요, 스택, 구조
└── ...
```

---

## 7. 마일스톤·진행 절차

| 단계 | 제목 | 한 줄 설명 | 산출물(예시) |
|------|------|------------|--------------|
| **1** | 환경·도구 준비 | GitHub 레포, Supabase·HiveMQ Cloud·Vercel 계정/설정, 프로젝트 초기화 | GitHub 레포, env 예시, 문서 |
| **2** | 데이터 모델·DB 설계 | Supabase 테이블·RLS (센서값, 액추에이터, 팜/사용자 설정) | 스키마, 마이그레이션 |
| **3** | 아두이노 R4 펌웨어 | 센서 읽기, HiveMQ Cloud MQTT publish/subscribe, 액추에이터 제어 | 펌웨어 코드, 배선/설정 문서 |
| **4** | MQTT(HiveMQ) 연동 | HiveMQ Cloud 토픽 설계, 웹/백엔드 구독·발행 구조 | 토픽 규칙, 연결 가이드 |
| **5** | 백엔드/API | Vercel Functions로 HiveMQ Cloud ↔ Supabase 연동, 인증·권한 | API 스펙, 배포 설정 |
| **6** | 웹 프론트엔드 | 대시보드, 실시간 모니터링, 제어 UI | 웹앱 코드, 스토리보드 |
| **7** | 통합 테스트·배포 | GitHub push → Vercel 배포, E2E 검증 | 배포 URL, 체크리스트 |

**의존 관계**

- 1 → 2 가능
- 2와 3은 병렬 가능
- 4는 3 이후, 5는 2·4 이후, 6은 5 이후, 7은 마지막

---

## 8. 가정·제약·참고

### 8.1 가정

- HiveMQ Cloud·Supabase·Vercel·GitHub 계정 및 네트워크 사용 가능
- 아두이노 우노 R4와 센서·액추에이터 배선·동작은 별도 검증 가능
- 단일 팜 기준으로 설계하며, 다중 팜은 추후 스키마·인증 확장

### 8.2 제약

- MQTT 브로커는 HiveMQ Cloud 사용 (변경 시 토픽·인증 재검토)
- 웹앱 배포는 Vercel 사용 (GitHub 연동 전제)

### 8.3 관련 문서

- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — 개요, 블록다이어그램, 진행 절차
- [TECH_STACK.md](./TECH_STACK.md) — 기술 스택 상세
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — 프로젝트 구조·네이밍·환경 변수

---

*이 PRD는 위 내용을 기준으로 하고, 단계별 진행 시 구체 요구사항·스펙은 대화를 통해 보완합니다.*
