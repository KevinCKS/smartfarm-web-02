# 스마트팜 웹 서비스 — 기술 스택

## 개요

웹 앱 개발·배포·통신·DB에 사용하는 기술을 정리한 문서입니다.

---

## 1. 정의된 기술 스택

| 분류 | 기술 | 용도 | 비고 |
|------|------|------|------|
| **런타임** | Node.js | 서버·빌드·API 실행 환경 | LTS 버전 권장 |
| **프레임워크** | Next.js | 풀스택 웹 앱 (SSR/SSG, API Routes, App Router) | React 기반 |
| **버전관리** | Git | 소스 버전 관리, 브랜치·태그 | — |
| **스타일** | Tailwind CSS | 유틸리티 기반 CSS, 반응형·테마 | — |
| **UI 컴포넌트** | shadcn/ui | 버튼, 카드, 폼 등 재사용 UI | Tailwind 기반, 복사 후 수정 가능 |
| **DB·백엔드** | Supabase | PostgreSQL DB, Auth, Realtime, Storage | 호스팅 DB·API |

---

## 2. 인프라·외부 서비스 (개요 문서와 동일)

| 분류 | 기술 | 용도 |
|------|------|------|
| **MQTT** | HiveMQ Cloud | 센서/액추에이터 MQTT 브로커 |
| **호스팅** | Vercel | Next.js 배포, Serverless Functions |
| **저장소** | GitHub | Git 원격 저장소, push → Vercel 연동 |

---

## 3. 스택별 요약

### Node.js
- Next.js 빌드·실행, API Routes·Server Actions 동작 환경
- 버전: **20.x LTS** 권장 (Vercel 호환)

### Next.js
- **App Router** 사용 (`app/` 디렉터리)
- 페이지·레이아웃·로딩·에러 처리
- API Routes: Supabase·HiveMQ 연동, 인증 프록시 등
- Vercel 배포에 최적화

### Git
- 브랜치 전략·커밋 규칙은 팀 정책에 따라 추가
- 기본: `main` 배포, 기능 브랜치 → PR → merge

### Tailwind CSS
- `tailwind.config`에서 디자인 토큰(색, 간격 등) 정의
- 다크 모드·반응형 브레이크포인트 활용

### shadcn/ui
- `components/ui/`에 필요한 컴포넌트만 복사해 사용
- Tailwind와 동일 설정으로 디자인 일관성 유지
- 대시보드·폼·카드·차트 등에 활용

### Supabase
- **Database**: 센서 로그, 액추에이터 상태, 사용자·팜 설정
- **Auth**: 로그인·회원가입 (필요 시)
- **Realtime**: 구독 기반 실시간 갱신 (선택)
- **Edge Functions**: 필요 시 서버 로직

---

## 4. 제외·선택 사항

- **상태관리**: 전역 상태 필요 시 Zustand·Jotai 등 추가 검토 (우선 React state·Server Components)
- **MQTT 클라이언트**: 브라우저/서버에서 MQTT 사용 시 `mqtt.js` 또는 서버 전용 라이브러리
- **차트**: 대시보드용으로 Recharts·Chart.js 등 추후 선택

---

## 5. 버전·설정 정리 시점

- **1단계(환경·도구 준비)** 에서 Next.js 프로젝트 생성 시 Node·Next·Tailwind·shadcn 버전 고정
- `package.json`, `README`에 권장 Node 버전 명시

이 문서는 프로젝트 구조·환경 설정 시 기준으로 사용합니다.
