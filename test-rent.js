const url = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent?serviceKey=ozMYWcXMtrdhKPiLNgBTMlyKK%2BxSvCYr70dqubOzKZlmh5ogqoxH%2FWDwtpLCI%2FdvplAT1h2fjC2uyRAR0uxW7g%3D%3D&LAWD_CD=11110&DEAL_YMD=202403&numOfRows=10&pageNo=1';

fetch(url)
    .then(async res => {
        console.log("Status:", res.status);
        console.log("Text:", await res.text());
    })
    .catch(console.error);
