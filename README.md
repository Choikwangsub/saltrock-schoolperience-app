# SaltRock Schoolperience App

SaltRock Schoolperience(솔트락 스쿨피리언스)의 **찾아가는 체험학습 플랫폼** 웹앱입니다.  
현재 프로젝트는 Next.js App Router 기반이며, 갤러리/문의폼/관리자 허브/캘린더를 로컬에서 확인할 수 있도록 구성되어 있습니다.

## 1) 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- lucide-react
- Notion SDK (`@notionhq/client`)
- Supabase JS SDK (`@supabase/supabase-js`)

## 2) 로컬 실행 (Windows PowerShell)

1. 프로젝트 폴더 이동

```powershell
cd "C:\Users\kwang\OneDrive\0000000. AI사업진행\코덱스 사업계획\플렛폼 사업 테스트\saltrock-schoolperience-app"
```

2. 의존성 설치

```powershell
npm install
```

3. 개발 서버 실행

```powershell
npm run dev
```

4. 빌드 검증

```powershell
npm run build
```

## 3) 다른 PC에서 이어서 작업 (OneDrive)

데스크탑/노트북 어디서든 같은 OneDrive 폴더를 열고 아래만 실행하면 됩니다.

```powershell
npm install
npm run dev
```

코드는 특정 PC 절대경로에 의존하지 않도록 작성되어 있습니다.

## 4) 환경변수

`.env.local` 파일에 아래 값을 설정하세요.  
실제 키/토큰은 절대 코드에 하드코딩하지 않습니다.

```bash
# Notion (server-only)
NOTION_TOKEN=
NOTION_PAGE_ID=
NOTION_GALLERY_DB_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin Hub
ADMIN_PASSWORD=
```

`.env.local.example`를 참고해 생성하면 됩니다.

## 5) 구현된 페이지

- `/`
  - 히어로, 프로그램 소개, 갤러리 미리보기, Why SaltRock, 문의하기
- `/programs/[slug]`
  - 프로그램 상세 페이지 (동적 라우팅)
- `/gallery`
  - 갤러리 카드형 그리드
- `/contact`
  - 문의 섹션 전용 페이지
- `/calendar`
  - 공개 일정 페이지 (`is_public=true` 일정만 노출)
- `/hub`
  - 관리자 허브 (비밀번호 인증 필요)
  - 탭: 문의 관리 / 캘린더 / 갤러리 관리 안내

## 6) 문의폼 + Supabase 저장

- 문의폼 제출 시 `POST /api/inquiries` 호출
- Supabase `inquiries` 테이블에 저장
- 성공 시 사용자 안내 메시지 노출
- 실패 시 오류 메시지 노출

문의 API:

- `POST /api/inquiries`: 문의 등록 (공개)
- `GET /api/inquiries`: 관리자 문의 조회 (보호)
- `PATCH /api/inquiries`: 상태/메모 수정 (보호)

관리자 보호 방식:

- 요청 헤더 `x-admin-password`
- 서버에서 `ADMIN_PASSWORD` 검증

## 7) 캘린더 + Supabase

- 관리자 허브에서 일정 추가/수정/삭제
- Supabase `calendar_events` 테이블 사용
- 공개 페이지는 `GET /api/calendar?public=true`로 조회

캘린더 API:

- `GET /api/calendar`
  - `?public=true`면 공개 일정만 조회
  - 그 외 조회는 관리자 인증 필요
- `POST /api/calendar`: 일정 추가 (보호)
- `PATCH /api/calendar`: 일정 수정 (보호)
- `DELETE /api/calendar`: 일정 삭제 (보호)

## 8) 갤러리 데이터 소스 (Fallback 포함)

갤러리는 아래 순서로 데이터 소스를 선택합니다.

1. Notion 갤러리 DB 조회
2. 실패 시 `public/gallery` 폴더 이미지
3. 그래도 없으면 프로그램 mock 이미지

즉 Notion 연동이 실패해도 홈페이지가 죽지 않고 기본 갤러리가 표시됩니다.

## 9) 이미지 경로 규칙

`public` 폴더 내부 파일은 코드에서 `public` 접두사 없이 사용합니다.

- 로고: `/brand/saltrock-schoolperience-logo.png`
- 히어로: `/hero/schoolperience-hero.png`
- 프로그램:
  - `/programs/laser-survival.jpg`
  - `/programs/sky-swing.jpg`
  - `/programs/sports-climbing.jpg`
  - `/programs/sports-day.jpg`
  - `/programs/ai-homepage.jpg`
  - `/programs/ai-diary.jpg`

## 10) Supabase SQL (필수)

아래 파일을 Supabase SQL Editor에서 실행하세요.

- `supabase/schema.sql`

포함 내용:

- `inquiries` 테이블 생성
- `calendar_events` 테이블 생성
- `updated_at` 트리거
- 인덱스
- RLS 기본 설정
- 공개 일정 조회 정책 (`is_public=true`)

## 11) Notion 초기 DB 생성 스크립트

Notion 상위 페이지 아래에 기본 DB를 자동 생성할 수 있습니다.

```powershell
npm run notion:setup
```

생성 대상:

- 갤러리 데이터베이스
- 프로그램 데이터베이스

같은 이름의 DB가 이미 있으면 중복 생성하지 않고 건너뜁니다.

## 12) 주요 파일 구조

```text
app/
  api/
    admin-auth/route.ts
    inquiries/route.ts
    calendar/route.ts
  calendar/page.tsx
  contact/page.tsx
  gallery/page.tsx
  hub/page.tsx
  programs/[slug]/page.tsx
  layout.tsx
  page.tsx
components/
  Header.tsx
  HeroSection.tsx
  ProgramGrid.tsx
  ProgramCard.tsx
  ProgramDetail.tsx
  GalleryGrid.tsx
  ContactSection.tsx
  ContactForm.tsx
  Footer.tsx
lib/
  types.ts
  mockData.ts
  programs.ts
  gallery.ts
  notion.ts
  inquiry.ts
  adminAuth.ts
  supabase/admin.ts
scripts/
  notion-setup.mjs
supabase/
  schema.sql
```

## 13) 보안 메모

- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 코드(`app/api/*`, `lib/supabase/admin.ts`)에서만 사용
- 브라우저 노출 키는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 허용
- `.env.local`은 `.gitignore`에 포함되어 GitHub에 올라가지 않음

## 14) 아직 하지 않은 것

현재 단계에서 아래는 **실행하지 않았습니다**.

- GitHub push
- Vercel 배포 실행
- 실제 도메인 연결
- 실제 운영용 Notion CMS 편집 워크플로 자동화

배포 단계에서 환경변수만 동일하게 설정하면 Vercel에서도 같은 구조로 동작하도록 구현되어 있습니다.
