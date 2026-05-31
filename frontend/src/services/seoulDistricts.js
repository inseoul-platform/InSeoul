/**
 * seoulDistricts.js — 서울 25개 구 법정동코드(LAWD_CD) 매핑
 * 출처: 행정표준코드관리시스템 법정동코드 전체자료.txt (2026-03-06 기준)
 */

export const SEOUL_DISTRICTS = [
    // 도심권
    { region: '종로구', lawdCd: '11110', x: '48%', y: '32%', price: 84000 },
    { region: '중구', lawdCd: '11140', x: '55%', y: '40%', price: 81000 },
    { region: '용산구', lawdCd: '11170', x: '50%', y: '52%', price: 130000 },
    // 동북권
    { region: '성동구', lawdCd: '11200', x: '63%', y: '48%', price: 110000 },
    { region: '광진구', lawdCd: '11215', x: '72%', y: '42%', price: 82000 },
    { region: '동대문구', lawdCd: '11230', x: '60%', y: '37%', price: 69000 },
    { region: '중랑구', lawdCd: '11260', x: '70%', y: '28%', price: 61000 },
    { region: '성북구', lawdCd: '11290', x: '57%', y: '27%', price: 67000 },
    { region: '강북구', lawdCd: '11305', x: '55%', y: '18%', price: 53000 },
    { region: '도봉구', lawdCd: '11320', x: '60%', y: '10%', price: 54000 },
    { region: '노원구', lawdCd: '11350', x: '70%', y: '14%', price: 57000 },
    // 서북권
    { region: '은평구', lawdCd: '11380', x: '18%', y: '22%', price: 61000 },
    { region: '서대문구', lawdCd: '11410', x: '28%', y: '34%', price: 68000 },
    { region: '마포구', lawdCd: '11440', x: '37%', y: '46%', price: 79000 },
    // 서남권
    { region: '양천구', lawdCd: '11470', x: '22%', y: '60%', price: 74000 },
    { region: '강서구', lawdCd: '11500', x: '12%', y: '54%', price: 66000 },
    { region: '구로구', lawdCd: '11530', x: '22%', y: '70%', price: 62000 },
    { region: '금천구', lawdCd: '11545', x: '30%', y: '78%', price: 58000 },
    { region: '영등포구', lawdCd: '11560', x: '37%', y: '62%', price: 86000 },
    { region: '동작구', lawdCd: '11590', x: '45%', y: '68%', price: 88000 },
    { region: '관악구', lawdCd: '11620', x: '40%', y: '80%', price: 72000 },
    // 동남권
    { region: '서초구', lawdCd: '11650', x: '52%', y: '74%', price: 158000 },
    { region: '강남구', lawdCd: '11680', x: '63%', y: '72%', price: 192000 },
    { region: '송파구', lawdCd: '11710', x: '72%', y: '76%', price: 132000 },
    { region: '강동구', lawdCd: '11740', x: '82%', y: '66%', price: 94000 },
];

/**
 * 구 이름으로 LAWD_CD 조회
 */
export function getLawdCd(regionName) {
    return SEOUL_DISTRICTS.find(d => d.region === regionName)?.lawdCd ?? null;
}
