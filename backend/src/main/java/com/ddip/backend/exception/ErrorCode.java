package com.ddip.backend.exception;

public enum ErrorCode {

    USER_NOT_FOUND(404, "U404", "해당 유저를 찾을 수 없습니다."),
    ALERT_NOT_FOUND(404, "A404", "알림을 찾을 수 없습니다."),
    INVALID_REQUEST(400, "C400", "잘못된 요청입니다."),
    EMAIL_INVALID(400, "M400", "유효하지 않은 이메일 주소입니다."),
    JSON_MAPPING_FAILED(500, "J002", "JSON 역직렬화 실패"),
    EMAIL_SEND_FAILED(502, "M001", "메일 발송 중 오류가 발생했습니다."),
    TOKEN_ISSUE_FAILURE(503, "E002", "액세스 토큰 발급 실패"),
    LOCK_TIMEOUT(503, "E003", "분산 락 획득/유지 시간 초과"),
    INTERNAL_ERROR(500, "S500", "내부 서버 오류");

    public final int httpStatus;
    public final String code;
    public final String message;

    ErrorCode(int httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }

}