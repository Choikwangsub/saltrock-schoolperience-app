# SaltRock Schoolperience App

SaltRock Schoolperience(솔트락 스쿨피리언스) 찾아가는 체험학습 플랫폼입니다.  
현재 구조는 **Next.js App Router + TypeScript + Tailwind CSS** 기반이며, 다음 기능을 포함합니다.

- 프로그램 소개/상세 페이지
- 갤러리(프로그램 폴더 → 앨범 → 사진)
- 문의 접수(`inquiries`)
- 공개 일정(`calendar_events`)
- 관리자 허브(`/hub`, `/hub/gallery`, `/hub/calendar`, `/hub/notion`)
- Supabase 저장 + Notion 보관/동기화 구조

## 1) 로컬 실행 (Windows PowerShell)

1. 프로젝트 폴더 이동

```powershell
cd "C:\Users\kwang\OneDrive\0000000. AI사업진행\코덱스 사업계획\플렛폼 사업 테스트\saltrock-schoolperience-app"
```

2. 패키지 설치

```powershell
npm install
```

3. 개발 서버 실행

```powershell
npm run dev
```

4. 프로덕션 빌드 검증

```powershell
npm run build
```

PowerShell 실행 정책으로 `npm`이 막히는 경우:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
& "C:\Program Files\nodejs\npm.cmd" run build
```

## 2) 다른 PC(데스크탑/노트북)에서 이어서 작업

OneDrive 동기화 후 같은 폴더를 열고 아래만 실행하면 됩니다.

```powershell
npm install
npm run dev
```

코드에는 특정 PC 절대경로를 하드코딩하지 않았습니다.

## 3) 환경변수

`.env.local.example`을 복사해 `.env.local`을 만들고 값만 입력하세요.

```env
NOTION_TOKEN=
NOTION_PAGE_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
```

보안 원칙:

- `NOTION_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`는 서버 전용입니다.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 클라이언트 공개용입니다.
- `.env.local`은 GitHub에 올리면 안 됩니다. (`.gitignore`에 포함됨)

## 4) 주요 페이지 경로

- `/` 메인 랜딩
- `/programs/[slug]` 프로그램 상세
- `/gallery` 프로그램별 갤러리 폴더 목록
- `/gallery/[programSlug]` 프로그램별 앨범 목록
- `/gallery/[programSlug]/[albumId]` 앨범 사진 목록
- `/contact` 문의 페이지
- `/calendar` 공개 일정 페이지 (`is_public=true`만 표시)
- `/hub` 관리자 허브 (문의 관리)
- `/hub/gallery` 갤러리 관리자
- `/hub/calendar` 일정 관리자
- `/hub/notion` Notion 연동 관리자

## 5) API Route 목록

공개 API:

- `GET /api/gallery/programs`
- `GET /api/gallery/albums?programSlug=...`
- `GET /api/gallery/photos?programSlug=...&albumId=...`
- `GET /api/calendar?public=true`
- `POST /api/inquiries`

관리자 API (`x-admin-password` 헤더 필요):

- `POST /api/admin-auth`
- `GET /api/inquiries`
- `PATCH /api/inquiries`
- `GET /api/hub/gallery/albums`
- `POST /api/hub/gallery/albums`
- `PATCH /api/hub/gallery/albums/[id]`
- `DELETE /api/hub/gallery/albums/[id]`
- `GET /api/hub/gallery/photos?albumId=...`
- `POST /api/hub/gallery/photos`
- `PATCH /api/hub/gallery/photos/[id]`
- `DELETE /api/hub/gallery/photos/[id]`
- `POST /api/hub/gallery/upload`
- `GET /api/hub/calendar`
- `POST /api/hub/calendar`
- `PATCH /api/hub/calendar/[id]`
- `DELETE /api/hub/calendar/[id]`
- `GET /api/hub/notion/status`
- `POST /api/hub/notion/setup`
- `POST /api/hub/notion/sync`

## 6) Supabase 스키마 적용

아래 SQL 파일을 **Supabase SQL Editor에서 수동 실행**하세요.

- `supabase/gallery-schema.sql`

포함 내용:

- extension
- 테이블 생성
  - `gallery_albums`
  - `gallery_photos`
  - `inquiries`
  - `calendar_events`
  - `notion_database_map`
- FK / index / `updated_at` trigger
- RLS 활성화 + 공개 조회 정책
- Storage `gallery` 버킷/정책

주의: 현재 gallery 버킷은 홈페이지 공개 갤러리 이미지 표시를 위해 Public bucket으로 사용하는 전제입니다. 따라서 공개 동의가 완료된 사진만 업로드해야 합니다. 진짜 비공개 사진까지 보호하려면 추후 Private bucket + Signed URL 구조로 전환해야 합니다.

## 7) 갤러리 업로드 경로 규칙

이미지 저장 경로:

```txt
gallery/{programSlug}/{albumId}/{fileName}
```

업로드 흐름:

```txt
관리자 화면
→ POST /api/hub/gallery/upload
→ 서버에서 SUPABASE_SERVICE_ROLE_KEY로 Storage 업로드
→ public URL 반환
→ gallery_photos / gallery_albums 저장
```

## 8) Notion DB 자동 생성/동기화

권장: 관리자 페이지에서 실행

1. `/hub/notion` 접속
2. `Notion DB 자동 생성/확인` 클릭
3. `전체 동기화` 또는 `실패 항목 재동기화` 실행

자동 생성 대상 DB:

- `SaltRock Gallery Albums`
- `SaltRock Gallery Photos`
- `SaltRock Inquiries`
- `SaltRock Calendar Events`

DB ID는 `notion_database_map` 테이블에 저장되어 코드 하드코딩 없이 사용됩니다.

선택: 로컬 스크립트 실행

```powershell
npm run notion:setup
```

이 스크립트는 `NOTION_PAGE_ID` 하위 DB를 생성/확인합니다(중복 생성 방지).

## 9) 캐시/최신화 처리

데이터 변경 API에서 `revalidatePath`를 사용합니다.
관리자 화면은 변경 후 `router.refresh()` 또는 재조회로 최신화됩니다.

주요 무효화 대상:

- `/gallery`
- `/gallery/[programSlug]`
- `/gallery/[programSlug]/[albumId]`
- `/hub/gallery`
- `/calendar`
- `/hub/calendar`
- `/hub/notion`
- `/contact`

## 10) 이미지 경로 규칙

`public` 폴더 파일은 코드에서 `public` 접두사 없이 사용합니다.

- 로고: `/brand/saltrock-schoolperience-logo.png`
- 히어로: `/hero/schoolperience-hero.png`
- 프로그램:
  - `/programs/laser-survival.jpg`
  - `/programs/sky-swing.jpg`
  - `/programs/sports-climbing.jpg`
  - `/programs/sports-day.jpg`
  - `/programs/ai-homepage.jpg`
  - `/programs/ai-diary.jpg`

## 11) 아직 직접 연결/실행하지 않은 항목

- GitHub push
- Vercel 배포 실행
- Supabase SQL 자동 실행
- 외부 채널(카카오/WhatsApp) 실링크 연결

위 항목은 별도 단계에서 진행해야 합니다.

## 12) 배포 전 체크리스트 (Vercel)

Vercel Project Environment Variables에 아래 키가 모두 있는지 확인:

- `NOTION_TOKEN`
- `NOTION_PAGE_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

그리고 배포 전 로컬에서 반드시:

```powershell
npm run build
```
