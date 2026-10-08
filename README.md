# news
한눈에 약업뉴스를 모아보는 사이트

## 약업 뉴스 데스크 (PHARMA DESK)

약업신문, 메디파나뉴스, 약사공론의 메인 기사 각 10개를 보여주는 웹사이트입니다.

- 기사 제목 클릭 시 원문 새 창 열기
- 기사 제목 검색과 분야별 필터
- 관심 키워드 강조와 빠른 검색
- 브라우저에 저장되는 기사 보관함과 NEW 표시
- 매체별 마지막 수집 시간 및 갱신 지연 표시
- PC·모바일 반응형 화면
- 검색창 아래 및 기사 목록 아래 광고 영역 (AdSense 코드는 아직 미연결)

## 실행

Node.js 22.13.0 이상과 pnpm 11.25.0을 사용합니다.

```bash
pnpm install
pnpm dev
```

개발 서버 기본 주소: http://localhost:5173

```bash
pnpm build
pnpm start
```

이 프로젝트는 React, TypeScript, Vinext와 Cloudflare Workers를 사용합니다. GitHub 업로드만으로 GitHub Pages에 실행되는 구조는 아니며 서버 실행 또는 별도 배포가 필요합니다. `.openai/hosting.json`은 기존 Sites 프로젝트의 비밀이 아닌 배포 설정입니다.

## 주요 소스

| 파일 | 역할 |
| --- | --- |
| `app/page.tsx` | 뉴스 화면, 검색, 분류, 보관함 |
| `app/globals.css` | 화면 디자인과 반응형 레이아웃 |
| `app/api/news/route.ts` | 뉴스 수집 API와 캐시 처리 |
| `lib/news.ts` | 언론사별 기사 제목과 링크 추출 |
| `lib/news-snapshot.json` | 수집 지연 시 표시하는 기존 기사 |
| `components/ad-space.tsx` | 상단·하단 광고 영역 |

광고 영역은 현재 ‘광고 준비 중’으로 표시됩니다. 실제 게재에는 발급받은 AdSense 광고 코드를 해당 영역에 연결해야 합니다.

기사 본문은 저장하지 않고 원문 링크를 제공합니다. 뉴스 수집이 실패하면 마지막 확인 기사가 표시됩니다. 보관함과 NEW 정보는 사용 중인 브라우저에만 저장됩니다.
