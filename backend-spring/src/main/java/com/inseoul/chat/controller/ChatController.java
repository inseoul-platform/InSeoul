package com.inseoul.chat.controller;

import com.inseoul.chat.dto.ChatRequest;
import com.inseoul.chat.service.ChatRelayService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Tag(name = "Chat", description = "RAG 챗봇 SSE 중계 API")
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRelayService chatRelayService;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    @Operation(summary = "챗봇 메시지 전송 (SSE 스트리밍)")
    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@Valid @RequestBody ChatRequest req) {
        SseEmitter emitter = new SseEmitter(300_000L); // 5분 타임아웃

        executor.execute(() -> {
            try {
                chatRelayService.relay(req)
                        .doOnNext(chunk -> {
                            try {
                                // FastAPI가 이미 "data: {...}\n\n" 형식으로 내보냄
                                // 순수 JSON이면 SseEmitter.event().data()로, 그렇지 않으면 raw 전송
                                String trimmed = chunk.trim();
                                if (trimmed.startsWith("data:")) {
                                    String payload = trimmed.substring(5).trim();
                                    emitter.send(SseEmitter.event().data(payload));
                                } else if (!trimmed.isEmpty()) {
                                    emitter.send(SseEmitter.event().data(trimmed));
                                }
                            } catch (IOException e) {
                                log.debug("Client disconnected: {}", e.getMessage());
                            }
                        })
                        .doOnComplete(emitter::complete)
                        .doOnError(e -> {
                            try {
                                emitter.send(SseEmitter.event()
                                        .data("{\"type\":\"error\",\"message\":\"챗봇 서버에 연결할 수 없습니다.\"}"));
                            } catch (IOException ignored) {}
                            emitter.completeWithError(e);
                        })
                        .blockLast();
            } catch (Exception e) {
                log.error("Chat relay failed: {}", e.getMessage());
                try {
                    emitter.send(SseEmitter.event()
                            .data("{\"type\":\"error\",\"message\":\"챗봇 서버 오류가 발생했습니다.\"}"));
                } catch (IOException ignored) {}
                emitter.complete();
            }
        });

        return emitter;
    }
}
