package com.ddip.backend.dto.error;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
    private String detail;
    private String cause;

    public ErrorResponse(String code, String message, Throwable cause) {
        this.code = code;
        this.message = message;
        this.detail = null;
        this.cause = cause.toString();
    }

    public ErrorResponse(String code, String message, String detail, Throwable cause) {
        this.code = code;
        this.message = message;
        this.detail = detail;
        this.cause = cause.toString();
    }
}
