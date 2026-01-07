package com.ddip.backend.handler;

import com.ddip.backend.dto.error.BusinessException;
import com.ddip.backend.dto.error.security.CustomAccessDeniedException;
import com.ddip.backend.dto.error.ErrorCode;
import com.ddip.backend.dto.error.ErrorResponse;
import com.ddip.backend.dto.error.security.CustomAuthenticationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {


    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> buildUncaughtException(Exception e) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        return ResponseEntity.status(status).body(new ErrorResponse("Unknown error occurred", e.getMessage(), e.getCause()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> buildErrorResponseException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();

        return build(errorCode, e.getDetail(), e.getCause());
    }

    @ExceptionHandler(CustomAccessDeniedException.class)
    public ResponseEntity<Object> buildErrorResponseException(CustomAccessDeniedException e) {
        ErrorCode errorCode = e.getErrorCode();

        return build(errorCode, e.getDetail(), e.getCause());
    }

    @ExceptionHandler(CustomAuthenticationException.class)
    public ResponseEntity<Object> buildErrorResponseException(CustomAuthenticationException e) {
        ErrorCode errorCode = e.getErrorCode();

        return build(errorCode, e.getDetail(), e.getCause());
    }

    private ResponseEntity<Object> build(ErrorCode errorCode, String detail, Throwable cause) {
        ErrorResponse body = (detail == null)
                ? new ErrorResponse(errorCode.code, errorCode.message, cause)
                : new ErrorResponse(errorCode.code, errorCode.message, detail, cause);

        return ResponseEntity.status(errorCode.httpStatus).body(body);
    }
}