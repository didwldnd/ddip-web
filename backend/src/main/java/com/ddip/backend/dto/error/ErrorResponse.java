package com.ddip.backend.dto.error;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
    private String detail;

    public ErrorResponse(String code, String message) {
        this.code = code;
        this.message = message;
        this.detail = null;
    }

    public ErrorResponse(String code, String message, String detail) {
        this.code = code;
        this.message = message;
        this.detail = detail;
    }
}
