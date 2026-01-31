# 1단계 — 환경·도구 준비

**산출물**: GitHub 레포, Supabase·HiveMQ Cloud·Vercel 계정/설정, 프로젝트 초기화, env 예시, 문서

---

## 1. 완료된 작업

- [x] Next.js 프로젝트 초기화 (TypeScript strict, Tailwind, App Router)
- [x] shadcn/ui 초기화 및 Button 컴포넌트 추가
- [x] `.env.example` 작성 (Supabase, HiveMQ Cloud 변수)
- [x] 프로젝트 폴더 구조 생성 (`app/`, `components/`, `lib/`, `hooks/`, `types/`, `config/`, `docs/`)

---

## 2. GitHub 레포 생성

1. [GitHub](https://github.com) 로그인 후 **New repository** 클릭
2. **Repository name**: `smartfarm-web` (또는 원하는 이름)
3. **Private** / **Public** 선택 후 **Create repository**
4. 로컬에서 초기 커밋 후 푸시:

```bash
# 프로젝트 루트로 이동 (Cursor에서 이미 01-Initial 을 열었다면 생략)
# PowerShell: 폴더명이 숫자로 시작하면 따옴표 사용
cd "01-Initial"
# 또는
cd .\01-Initial

git init
git add .
git commit -m "chore: 1단계 환경·도구 준비 (Next.js, shadcn, env 예시)"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/smartfarm-web.git
git push -u origin main
```

---

## 3. Supabase 설정

1. [Supabase](https://supabase.com) 가입 후 **New project** 생성
2. **Project name**, **Database password** 설정 후 리전 선택
3. 프로젝트 대시보드 → **Settings** → **API** 에서 확인:
   - **Project URL** → `.env.local` 의 `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** 키 (서버 전용) → `SUPABASE_SERVICE_ROLE_KEY` (API Routes 등에서만 사용, 클라이언트 노출 금지)

---

## 4. HiveMQ Cloud 설정

1. [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/) 가입 후 **Cluster** 생성
2. **Connect** 탭에서 확인:
   - **Broker URL** (8883: `ssl://host:8883` / 8884 WebSocket: `wss://host:8884`) → `MQTT_BROKER_URL`
   - **Username** → `MQTT_USERNAME`
   - **Password** → `MQTT_PASSWORD`
3. **Client ID** 는 아두이노/웹 서버 각각 고유 값 사용 (예: `smartfarm-arduino`, `smartfarm-web-api`)
4. 위 값들을 `.env.local` 에 넣고 Git 에 커밋하지 않기

---

## 5. Vercel 설정

1. [Vercel](https://vercel.com) 가입 후 **Add New** → **Project**
2. **Import Git Repository** 에서 위에서 만든 GitHub 레포 (`smartfarm-web`) 선택
3. **Root Directory**: `./` (레포 루트가 프로젝트 루트인 경우)
4. **Environment Variables** 에 `.env.example` 참고하여 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)
   - `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_CLIENT_ID`
5. **Deploy** 후 배포 URL 확인

---

## 6. 로컬 환경 변수

1. 프로젝트 루트에 `.env.local` 파일 생성
2. `.env.example` 내용을 복사한 뒤 실제 값 채우기
3. `.env.local` 은 Git 에 커밋하지 않음 (`.gitignore` 에 포함됨)

---

## 7. 로컬 실행 확인

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 동작 확인.

---

## 8. 다음 단계

**2단계**: 데이터 모델·DB 설계 (Supabase 테이블·RLS 설계)
