# smartfarm-web

스마트팜 웹 서비스 — 센서 데이터 수집·시각화·액추에이터 제어

## 기술 스택

- **Next.js 14+** (App Router), **TypeScript** (strict), **Node.js 20+**
- **Tailwind CSS**, **shadcn/ui**
- **Supabase** (Auth, Database), **HiveMQ Cloud** (MQTT)
- **GitHub** (버전관리), **Vercel** (배포)

## 사전 요구사항

- Node.js 20 이상
- npm (또는 pnpm/yarn)

## 로컬 실행

```bash
# 프로젝트 루트(01-Initial)에서 실행. PowerShell 에서 숫자로 시작하는 폴더는 cd "01-Initial" 사용
npm install
cp .env.example .env.local   # 값 채우기 (Windows: copy .env.example .env.local)
npm run dev
```

`http://localhost:3000` 에서 확인

## 환경 변수

`.env.example` 참고. Supabase, HiveMQ Cloud 값은 각 서비스 대시보드에서 확인.

## 문서

- [PRD](docs/PRD.md) — 제품 요구사항
- [프로젝트 개요·진행 절차](docs/PROJECT_OVERVIEW.md)
- [기술 스택](docs/TECH_STACK.md)
- [프로젝트 구조](docs/PROJECT_STRUCTURE.md)
- [1단계 환경·도구 준비](docs/1-env-setup.md)

## 라이선스

Private
