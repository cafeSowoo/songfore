# Songfore

송포레 도구 모음 홈페이지입니다.

## Included

- 조 편성 도구
- 공지 메일 도구
- 책 추천, 책 표지, 책 콜라주 도구
- 일부 도구용 Netlify Functions

## 로컬 준비

```bash
npm start
```

그다음 `http://127.0.0.1:4173`에서 확인합니다.

## Netlify

- Publish directory: `.`
- Build command: `npm run build`

Netlify production은 운영 배포할 때만 unlock/deploy/re-lock 원칙으로 다룹니다.

Netlify 복귀를 위해 `netlify.toml`과 `netlify/functions/`를 유지합니다.
프론트엔드는 `/api/*`를 호출하고, Netlify에서는 `netlify.toml`의 redirect가
`/.netlify/functions/:splat`로 연결합니다.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Functions directory: `functions`

Cloudflare Pages에서는 `functions/api/*`가 `/api/*` 요청을 처리합니다.
환경 변수는 Cloudflare Pages 프로젝트 설정에 아래 이름으로 등록합니다.

- `ALADIN_TTB_KEY`
- `GOOGLE_BOOKS_API_KEY`
- `GEMINI_API_KEY`
- `MANUS_API_KEY`

### 모임 업데이트 도구

`/tools/meeting-admin/`은 `/api/meeting-sheet`를 통해 Google Sheets에 저장합니다.
운영 배포 환경에 아래 값을 등록합니다.

- `MEETING_ADMIN_TOKEN`: 운영진 화면에서 입력할 저장 토큰
- `GOOGLE_SERVICE_ACCOUNT_JSON`: Google 서비스 계정 JSON 전체 문자열
- `SONGFORE_ATTENDANCE_SPREADSHEET_ID`: 출석부 스프레드시트 ID. 생략하면 현재 출석부 ID를 사용합니다.

서비스 계정의 `client_email`을 출석부 Google Sheet에 편집자로 공유해야 합니다.

`songfore.com` 전환 전에는 `cf.songfore.com` 같은 임시 도메인으로 먼저 확인합니다.

## Archived

이전에 `/dj`에서 운영하던 여행 보드는 별도 아카이브 프로젝트로 분리했습니다.
