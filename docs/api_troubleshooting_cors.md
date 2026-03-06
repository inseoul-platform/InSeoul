# API 연동 트러블슈팅 및 CORS 해결가이드

본 문서는 `인서울 (InSeoul)` 프로젝트 진행 중 외부/공공 API 연동 시 발생할 수 있는 주요 CORS 및 도메인 차단 문제를 해결하기 위한 설정 가이드입니다.

---

## 1. 카카오 지도 API `ERR_BLOCKED_BY_ORB` 이슈

### 원인
카카오 지도 웹 SDK는 보안 정책상 **[카카오 개발자 사이트 - 내 애플리케이션 - 플랫폼]**에 등록된 웹 도메인과 정확히 일치하는 환경에서만 정상 로드됩니다. 만약 `127.0.0.1`로 등록해 두고 `localhost` 도메인으로 접근하거나 반대의 경우, 서버에서 브라우저 응답 정책(ORB) 위반으로 간주하여 SDK 스크립트가 블락되고 맵이 빈 공백으로 노출됩니다.

### 해결 방법
현재 프로젝트의 타겟 환경을 `127.0.0.1:5500`으로 고정하여 다음과 같이 동기화했습니다.
1. `vite.config.js`의 `server: { host: '127.0.0.1', port: 5500 }` 로컬 실행 포트 강제 할당
2. **카카오 디벨로퍼스 웹 플랫폼 사이트 도메인**에 `http://127.0.0.1:5500` 등록 (반드시 HTTP 포함, 포트번호 포함)
3. 브라우저 주소창에서 접속 시 반드시 `http://127.0.0.1:5500` 으로 접속하기

---

## 2. 국토교통부(MOLIT) 실거래가 API 브라우저단 CORS 에러

### 원인
공공데이터 포털(apis.data.go.kr)의 대부분의 Open API는 브라우저 레벨에서 다이렉트로 Ajax/Fetch 호출 시 **CORS(Cross-Origin Resource Sharing)** 규정 위반으로 인해 네트워크 에러(`blocked by CORS policy`)를 발생시킵니다. 
데이터가 정상적으로 파싱되고 API KEY가 정상이더라도, 웹 서버(Backend) 역할을 도와주는 중간 Proxy 없이는 브라우저 차원에서 데이터를 불러들이는 것을 원천 차단합니다.

### 해결 방법 (Vite Proxy)
프런트엔드 전용 프로젝트이므로, Vite에서 제공하는 자체 Development Server Proxy를 사용하여 브라우저가 직접 공공데이터 서버가 아니라 "동일한 로컬 개발서버의 내부 라우트"로 인식하게끔 우회시킵니다.

#### 1) `vite.config.js` 서버 프록시 설정
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    // ...
    proxy: {
      '/api/molit': {
        target: 'https://apis.data.go.kr', // 🚀 실제 공공 데이터 서버
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/molit/, '') // 대상지 도달 시 해당 prefix는 제거
      }
    }
  }
})
```

#### 2) `.env` 내부의 Base URL 변경
API 호출 시 원래 EndPoint가 아니라, 로컬 프록시 Path로 요청을 보냅니다.
```env
# 변경 전 (이대로 쓰면 브라우저 CORS 차단)
# VITE_MOLIT_API_BASE=https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade

# 변경 후 (Vite Proxy 라우팅을 타게끔 상대경로화)
VITE_MOLIT_API_BASE=/api/molit/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade
```

#### 3) 실 호출 원리
`fetch()`를 통해 `VITE_MOLIT_API_BASE` 로 데이터를 요청(`http://127.0.0.1:5500/api/molit/...`)
👉 브라우저는 "어라? 내 도메인이랑 같네. CORS 통과!" 
👉 Vite Dev 서버가 백그라운드에서 이 요청을 가로챔 
👉 타겟인 `https://apis.data.go.kr/...` 으로 요청을 전송하고, 받은 데이터를 브라우저에 그대로 던져줌

> **유의사항:** 본 방법은 개발환경(`npm run dev`)에서만 유효합니다. 만약 프로덕션(Vercel, Netlify)에 배포할 때는 해당 배포 플랫폼의 `serverless function` 혹은 `<Rewrites>` 기능을 통해 실운영 서버용 Proxy를 한 번 더 잡아주어야 합니다.
