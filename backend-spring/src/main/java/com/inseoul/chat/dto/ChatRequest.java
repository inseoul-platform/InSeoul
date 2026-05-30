package com.inseoul.chat.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatRequest {
    @NotBlank private String message;
    private List<Map<String, String>> history = new ArrayList<>();
    private Map<String, Object> context;
}
