# SaltRock Schoolperience App

SaltRock Schoolperience(솔트락 스쿨피리언스)의 찾아가는 체험학습 플랫폼 웹앱입니다.  
현재 단계는 **로컬 테스트용 UI/기능 구현 단계**이며, 실제 배포/외부 서비스 연동은 포함하지 않습니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- lucide-react
- npm 기반 로컬 실행
- PWA 확장을 위한 `public/manifest.webmanifest` 기본 구조 준비

## 로컬 실행 방법 (Windows PowerShell)

1. 프로젝트 폴더로 이동

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

4. 브라우저에서 확인

- `http://localhost:3000`

## 다른 PC(데스크탑/노트북)에서 이어서 작업하는 방법

OneDrive 동기화 후, 해당 PC에서 같은 프로젝트 폴더를 열고 아래만 실행하면 됩니다.

```powershell
npm install
npm run dev
```

코드는 특정 PC 절대경로에 의존하지 않도록 작성되어 있습니다.

## 구현된 페이지/기능

- 메인 페이지 `/`
  - 공통 Header / Footer
  - Hero 섹션
  - 프로그램 카드 6개
  - 반응형 카드 그리드 (모바일 1열 / 태블릿 2열 / PC 3열)
  - 문의 채널 섹션
  - 문의 폼 (필수값 검증 + 이메일 형식 검증 + 콘솔 출력 mock)
  - 모바일 하단 고정 `문의하기` 버튼

- 프로그램 상세 페이지 `/programs/[slug]`
  - 동적 라우팅 기반 단일 템플릿
  - 대표 이미지 영역
  - 프로그램 제목 / 한 줄 소개
  - 추천 대상 / 운영 가능 학년 / 운영 시간 / 운영 장소
  - 태그 / 진행 순서 / 준비물·필요 환경 / 안전·운영 안내
  - 문의하기 버튼 (`/#contact`)
  - 메인으로 돌아가기 버튼

## 데이터 구조

- `lib/types.ts`
  - `Program`, `Inquiry` 타입 정의
- `lib/mockData.ts`
  - 프로그램 mock 데이터 6개
- `lib/programs.ts`
  - `getPrograms()`, `getProgramBySlug(slug)` 제공
- `lib/inquiry.ts`
  - `submitInquiry(data)` mock 처리
- `services/notion.ts`
  - 추후 Notion 연동을 위한 서버 함수 스텁

## 환경변수 파일 규칙

- 실제 `.env.local`은 생성하지 않고, 예시 파일만 제공합니다.
- 파일: `.env.local.example`
- 실제 키(토큰, API key)는 코드에 직접 넣지 말고 환경변수로만 관리하세요.

## 이미지 파일 경로 규칙

아래 파일 경로에 실제 이미지를 넣으면 자동으로 반영됩니다.

- 로고: `public/brand/saltrock-schoolperience-logo.png`
- 메인 히어로: `public/hero/schoolperience-hero.png`
- 레이저 서바이벌: `public/programs/laser-survival.jpg`
- 하늘그네: `public/programs/sky-swing.jpg`
- 스포츠 클라이밍: `public/programs/sports-climbing.jpg`
- 명랑운동회: `public/programs/sports-day.jpg`
- AI 홈페이지: `public/programs/ai-homepage.jpg`
- AI 그림일기: `public/programs/ai-diary.jpg`

이미지가 아직 없으면 카드/상세/히어로는 브랜드 톤 fallback 배경으로 안전하게 표시됩니다.

## 동기화/버전관리 주의사항

아래는 Git 관리 대상이 아니며, 동기화 이슈가 생기면 삭제 후 재설치/재빌드 가능합니다.

- `node_modules`
- `.next`
- `out`
- `dist`
- 로그 파일(`*.log`, `npm-debug.log*` 등)
- `.env.local`

## 폴더 구조 (주요 파일)

```text
app/
  layout.tsx
  page.tsx
  not-found.tsx
  programs/[slug]/page.tsx
components/
  Header.tsx
  HeroSection.tsx
  ProgramCard.tsx
  ProgramGrid.tsx
  ProgramDetail.tsx
  ContactSection.tsx
  ContactForm.tsx
  MobileBottomCTA.tsx
  Footer.tsx
  Badge.tsx
  SectionTitle.tsx
lib/
  types.ts
  mockData.ts
  programs.ts
  inquiry.ts
services/
  notion.ts
.env.local.example
```

## 지금 단계에서 하지 않은 것

아래 항목은 **나중에 별도 단계에서 진행**해야 합니다.

- 실제 Notion API 연결
- 실제 외부 서비스 연동
- GitHub push
- Vercel 배포 / Production 배포
- 도메인 연결

## 다음 단계(추후) 체크리스트

1. Notion 데이터베이스 스키마 확정
2. `services/notion.ts`에 실제 조회/저장 로직 구현
3. 문의 폼 서버 전송(API Route 또는 Server Action) 연결
4. 배포 전 환경변수/메타데이터/오류페이지 최종 점검
5. GitHub 연결 후 CI 및 Vercel 배포 설정
