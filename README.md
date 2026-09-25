# 정보처리기사 용어 웹

정보처리기사 시험 대비 용어 학습 자료 모음입니다.
용어 **1,008개** · 실무 예시 **1,008개** · 도식 **464개** · 챕터 **69개** · 혼동 링크 **2,473건**

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `gigsa-site/` | **배포용 웹앱 (PWA)** — 용어사전 + 검색 + 도식 + 오프라인 지원 |
| `정보처리기사_Anki_용어.tsv` 등 | Anki 임포트용 카드 데이터 (용어 / 약어 / 혼동짝) |
| `정보처리기사_용어사전_Anki.apkg` | 빌드된 Anki 패키지 — 더블클릭으로 바로 임포트 |
| `anki-build/` | Anki 덱 빌드 스크립트 (`build.py`, `tsv.py`, `extract.js`) |
| `정보처리기사_용어사전.html` | 단일 파일 용어사전 — 브라우저에서 바로 열림 |
| `정보처리기사_오답개념맵.html` | 오답 개념도 |
| `sorting_visualizer (1).html`, `code_artifact.html` | 보조 학습 자료 |
| `오답노트_꿈라_사진/` | 오답노트 스크린샷 |
| `Anki_사용법.md` | Anki 임포트·사용 안내 |

## 이용 방법

### 1. 웹앱으로 사용 (gigsa-site)

**로컬에서 바로 보기**
`gigsa-site/index.html`을 더블클릭하면 열립니다. (`file://`에서는 오프라인 캐시만 동작하지 않음)

로컬 서버로 전체 기능 확인:

```
python -m http.server 8000 --directory gigsa-site
```

→ `http://localhost:8000` 접속

**배포하기**
자세한 방법은 [gigsa-site/README.md](gigsa-site/README.md) 참고.
가장 빠른 방법: `gigsa-site` 폴더를 [Netlify Drop](https://app.netlify.com/drop)에 끌어다 놓기.

> 이 저장소는 GitHub Pages를 사용하지 않습니다. Netlify 등에서 별도 배포하세요.

**폰에 설치하기**
배포된 주소를 폰에서 열고 끝까지 한 번 스크롤(오프라인 캐시 저장) 후,
Safari는 공유 → 홈 화면에 추가 / Android Chrome은 ⋮ → 앱 설치.

### 2. Anki로 사용

`정보처리기사_용어사전_Anki.apkg`를 더블클릭해 Anki에 임포트하거나,
`.tsv` 파일을 직접 임포트합니다. 자세한 방법은 [Anki_사용법.md](Anki_사용법.md) 참고.

### 3. 내용 수정

용어·예시·도식 데이터 형식과 수정 후 재배포 방법은
[gigsa-site/README.md](gigsa-site/README.md) 의 "4. 내용 추가·수정하기" 참고.

> **주의**: 수정 후 재배포할 때는 `gigsa-site/sw.js` 첫 줄의 `CACHE` 버전을
> 올려야 기존 방문자의 캐시가 갱신됩니다.
