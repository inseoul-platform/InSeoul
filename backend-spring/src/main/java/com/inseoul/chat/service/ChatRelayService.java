package com.inseoul.chat.service;

import com.inseoul.chat.dto.ChatRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRelayService {

    private final WebClient webClient;

    @Value("${chatbot.url:http://127.0.0.1:8000}")
    private String chatbotUrl;

    /**
     * FastAPI SSE 스트림을 raw SSE 줄(data: ...)로 Flux 반환.
     * 파싱 없이 그대로 패스스루 → 클라이언트가 직접 파싱.
     */
    public Flux<String> relay(ChatRequest req) {
        return webClient.post()
                .uri(chatbotUrl + "/chat")
                .header("Content-Type", "application/json")
                .bodyValue(req)
                .retrieve()
                .bodyToFlux(String.class)
                .doOnError(e -> log.error("FastAPI relay error: {}", e.getMessage()))
                .onErrorReturn("data: {\"type\":\"error\",\"message\":\"챗봇 서버 오류가 발생했습니다.\"}\n\n");
    }
}
