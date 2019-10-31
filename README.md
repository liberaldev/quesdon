# quesdon

Mastodon/Misskey를 위한 ask.fm 같은거

LICENSE: [AGPL 3.0](LICENSE)

## how to run

required: latest version Node.js, MongoDB

```sh
yarn install
yarn build
MONGODB_URL=mongodb://localhost/quesdon BACK_PORT=3000 yarn start
```

## 개발

### 개발 환경 구축

`cp .env.development .env`한 뒤 `yarn dev`로 빌드 후 <http://localhost:8080> 로 접속

### 디렉터리 구조

굳이 안 적어놔도 보면 알겠지만 혹시 모르니까

- `src/`: 소스
    - `server/`: 서버 사이드 소스
        - `api/`: API 엔드포인트
        - `db/`: 데이터베이스 모델
        - `utils/`: 잡다한 것들
    - `client/`: 클라이언트 소스
- `views/`: 서버 사이드 템플릿 (pug 템플릿 엔진 사용)