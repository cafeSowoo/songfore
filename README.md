# Songfore DJ Trip

`/dj` 경로에서 동작하는 여행 장소 공유 MVP입니다.

현재 버전은 다음에 집중합니다.

- 에어비앤비 스타일의 좌우 분할 레이아웃
- 카테고리 필터
- 장소 추가 UI
- 작성자 및 댓글 UI
- Netlify Functions + Supabase 연동
- 네이버 지도, 서버 지오코딩, 장소 검색 연결

## 로컬 준비

1. `.env.example` 값을 참고해 환경 변수를 준비합니다.
2. `npm run build` 를 실행하면 `config/runtime-config.js` 가 생성됩니다.
3. `npm start` 로 정적 페이지를 확인할 수 있습니다.

장소 검색형 후보 추가를 사용하려면 Netlify 환경 변수에
`NAVER_SEARCH_CLIENT_ID`, `NAVER_SEARCH_CLIENT_SECRET` 을 함께 설정해야 합니다.

## Netlify

- Publish directory: `.`
- Build command: `npm run build`

## 다음 연결 포인트

- 초대코드 검증
- 여행 일정 / 투표 기능
