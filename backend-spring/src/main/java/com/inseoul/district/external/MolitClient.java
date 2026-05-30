package com.inseoul.district.external;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MolitClient {

    private static final String TRADE_BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
    private static final String RENT_BASE  = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent";

    private final WebClient webClient;

    @Value("${molit.api-key:}")
    private String apiKey;

    /**
     * 특정 구의 최근 3개월 매매/전세 평균가를 만원 단위로 반환.
     * API 키 미설정 시 null 반환.
     */
    public MolitPriceResult fetchAvgPrice(String lawdCd) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("MOLIT API key not configured, skipping external fetch for {}", lawdCd);
            return null;
        }

        List<String> months = getRecentThreeMonths();
        List<Long> tradePrices = new ArrayList<>();
        List<Long> rentPrices  = new ArrayList<>();

        for (String ym : months) {
            tradePrices.addAll(fetchPrices(TRADE_BASE, lawdCd, ym, "trade"));
            rentPrices.addAll(fetchPrices(RENT_BASE, lawdCd, ym, "rent"));
        }

        BigDecimal tradeAvg = average(tradePrices);
        BigDecimal rentAvg  = average(rentPrices);
        return new MolitPriceResult(tradeAvg, rentAvg);
    }

    private List<Long> fetchPrices(String baseUrl, String lawdCd, String dealYmd, String type) {
        List<Long> prices = new ArrayList<>();
        try {
            String url = baseUrl + "?serviceKey=" + apiKey
                    + "&LAWD_CD=" + lawdCd
                    + "&DEAL_YMD=" + dealYmd
                    + "&numOfRows=2000&pageNo=1";

            String xml = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (xml == null) return prices;

            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            DocumentBuilder db = dbf.newDocumentBuilder();
            Document doc = db.parse(new InputSource(new StringReader(xml)));

            NodeList items = doc.getElementsByTagName("item");
            for (int i = 0; i < items.getLength(); i++) {
                Element item = (Element) items.item(i);
                if ("trade".equals(type)) {
                    String amount = textOf(item, "dealAmount");
                    if (amount != null) prices.add(Long.parseLong(amount.replace(",", "").trim()));
                } else {
                    String monthlyRent = textOf(item, "monthlyRent");
                    if ("0".equals(monthlyRent) || monthlyRent == null) {
                        String deposit = textOf(item, "deposit");
                        if (deposit != null) prices.add(Long.parseLong(deposit.replace(",", "").trim()));
                    }
                }
            }
        } catch (Exception e) {
            log.error("MOLIT fetch failed for {} / {} / {}: {}", lawdCd, dealYmd, type, e.getMessage());
        }
        return prices;
    }

    private String textOf(Element parent, String tagName) {
        NodeList nl = parent.getElementsByTagName(tagName);
        if (nl.getLength() == 0) return null;
        String text = nl.item(0).getTextContent();
        return (text == null || text.isBlank()) ? null : text;
    }

    private BigDecimal average(List<Long> values) {
        if (values.isEmpty()) return null;
        long sum = values.stream().mapToLong(Long::longValue).sum();
        return BigDecimal.valueOf(sum).divide(BigDecimal.valueOf(values.size()), 0, RoundingMode.HALF_UP);
    }

    private List<String> getRecentThreeMonths() {
        List<String> months = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 1; i <= 3; i++) {
            months.add(today.minusMonths(i).format(DateTimeFormatter.ofPattern("yyyyMM")));
        }
        return months;
    }

    public record MolitPriceResult(BigDecimal tradeAvg, BigDecimal rentAvg) {}
}
