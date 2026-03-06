# Kakao 지도 API 연동 가이드

참고 링크: [Kakao 지도 Web API 가이드](https://apis.map.kakao.com/web/guide/)

## 1. 준비하기 (API Key 발급)

Kakao 지도 Javascript API를 사용하려면 카카오 계정으로 키를 발급받아야 합니다.

1. [카카오 개발자사이트](https://developers.kakao.com)에 접속하여 로그인합니다.
2. 개발자 등록 후 **[내 애플리케이션]**에서 앱을 생성합니다.
3. 생성한 앱의 **[앱 설정] > [요약 정보]** 페이지에서 **JavaScript 키**를 확인합니다.
4. **[앱 설정] > [플랫폼]** 메뉴로 이동하여 **Web 플랫폼**을 추가하고, 실제 서비스를 구동할 사이트 도메인 (예: `http://127.0.0.1:5500`)을 등록합니다.
   * **주의**: 등록된 도메인에서만 API 요청이 정상적으로 처리됩니다. 브라우저에서 `localhost` 대신 반드시 `127.0.0.1`로 접속해야 지도 SDK가 차단(ORB)되지 않습니다.

---

## 2. API 불러오기

HTML 문서(`<head>` 또는 `<body>` 하단)에 아래의 스크립트 태그를 넣어 Kakao 지도 라이브러리를 불러옵니다. 실행 코드보다 항상 먼저 선언되어야 합니다.

```html
<!-- 발급받은 JavaScript 키를 파라미터로 삽입 -->
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=발급받은_APP_KEY를_넣으세요"></script>
```

### 추가 라이브러리 사용하기
클러스터링, 장소 검색, 지도 그리기 기능 등을 사용하려면 `&libraries=` 파라미터를 추가하여 라이브러리를 함께 불러와야 합니다.
지원 라이브러리:
- `clusterer`: 마커 클러스터링 기능
- `services`: 장소 검색, 주소-좌표 변환 기능
- `drawing`: 지도 위에 마커/도형 그리기 기능

```html
<!-- services와 clusterer를 함께 불러오는 예시 -->
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=APIKEY&libraries=services,clusterer"></script>
```

---

## 3. 웹 페이지에 지도 띄우기

### 3-1. 지도를 담을 영역(DOM) 생성
HTML 안에 지도가 그려질 영역을 위한 `div` 태그를 선언하고 크기를 지정합니다.

```html
<div id="map" style="width:100%;height:400px;"></div>
```

### 3-2. 지도 생성 Script 작성
스크립트 태그 아래에 옵션을 정의하여 지도를 렌더링하는 코드를 작성합니다. `center` (중심 좌표)는 필수값입니다.

```javascript
var container = document.getElementById('map'); // 지도를 담을 영역의 DOM 레퍼런스
var options = { // 지도를 생성할 때 필요한 기본 옵션
    center: new kakao.maps.LatLng(33.450701, 126.570667), // 지도의 중심좌표
    level: 3 // 지도의 레벨(확대, 축소 정도)
};

var map = new kakao.maps.Map(container, options); // 지도 생성 및 객체 리턴
```

---

## 4. Map 객체 상세 (Options & Events)

참고 링크: [Kakao 지도 Web API - Map](https://apis.map.kakao.com/web/documentation/#Map)

### 4-1. Map 객체 생성 옵션 (Options)
지도를 생성할 때 넘겨줄 수 있는 주요 옵션들입니다. `react-kakao-maps-sdk`의 `<Map>` 컴포넌트 Props로도 대부분 매핑됩니다.

- `center` **(필수)**: 지도의 중심 좌표입니다. `kakao.maps.LatLng` 객체로 지정합니다.
- `level`: 지도의 초기 확대 수준을 설정합니다. (기본값: 3, 숫자가 작을수록 확대됨)
- `mapTypeId`: 지도 종류를 설정합니다. (기본값: 일반 지도)
- `draggable`: 마우스 드래그, 휠, 모바일 터치를 이용한 지도 구석 이동 가능 여부입니다. (기본값: true)
- `scrollwheel`: 마우스 휠, 모바일 터치를 통한 확대/축소 가능 여부입니다. (기본값: true)
- `disableDoubleClick`: 더블클릭 이벤트 및 더블클릭을 통한 줌인 동작 제어 여부입니다.
- `disableDoubleClickZoom`: 더블클릭을 통한 확대 기능을 끌 수 있습니다.
- `keyboardShortcuts`: 키보드 방향키 등으로 지도 이동, 확대, 축소를 가능하게 할지 설정합니다. (기본값: false)

### 4-2. Map 객체 주요 이벤트 (Events)
지도 상호작용을 처리하기 위한 주요 이벤트들입니다. (바닐라 JS에서는 `kakao.maps.event.addListener`를 사용)

- `center_changed`: 중심 좌표가 변경될 때마다 발생
- `zoom_start`: 지도 확대 수준이 변경되기 직전에 발생
- `zoom_changed`: 지도 확대 수준이 변경되었을 때 발생
- `bounds_changed`: 지도의 영역이 마우스 이동/확대 등으로 변경 시 발생
- `click`: 지도를 클릭했을 때 발생 (이벤트 인자로 클릭한 위치 좌표 등을 포함하는 `MouseEvent`가 전달됨)
- `dblclick`: 지도를 더블클릭했을 때 발생
- `rightclick`: 지도를 우클릭했을 때 발생
- `mousemove`: 마우스 커서가 지도 위를 움직일 때 발생
- `dragstart`, `drag`, `dragend`: 지도를 마우스나 터치로 드래그하는 시작, 진행, 종료 시점에 각각 발생

---

## 참고: React 프로젝트(InSeoul) 내에서의 연동
현재 `InSeoul` 프로젝트는 `react-kakao-maps-sdk` 서드파티 라이브러리를 사용하여 코드를 간결하게 관리하고 있습니다. 
따라서 `index.html`에 위의 `<script>` 태그를 삽입하고 React 컴포넌트에서는 아래와 같이 사용합니다. (`onZoomChanged`, `onDragEnd` 등 위 카카오 이벤트를 Prop으로 쉽게 처리 가능)

```jsx
import { Map, MapMarker } from 'react-kakao-maps-sdk';

function MyMap() {
  return (
    <Map 
      // options 매핑
      center={{ lat: 33.450701, lng: 126.570667 }} 
      style={{ width: "100%", height: "400px" }} 
      level={3}
      draggable={true}

      // events 매핑
      onClick={(_t, mouseEvent) => console.log("click!", mouseEvent.latLng)}
      onZoomChanged={(map) => console.log("zoom changed!", map.getLevel())}
      onDragEnd={(map) => console.log("dragged center", map.getCenter())}
    >
      <MapMarker position={{ lat: 33.450701, lng: 126.570667 }} />
    </Map>
  );
}
```
