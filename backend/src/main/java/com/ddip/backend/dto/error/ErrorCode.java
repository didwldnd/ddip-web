package com.ddip.backend.dto.error;

public enum ErrorCode {

    INTERNAL_ERROR(500, "S500", "내부 서버 오류"),

    TOKEN_EXPIRED(401, "U401", "accessToken 만료"),

    PROFILE_INCOMPLETE(403, "P403", "프로필 미완성 예외");

    public final int httpStatus;
    public final String code;
    public final String message;

    ErrorCode(int httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }
}