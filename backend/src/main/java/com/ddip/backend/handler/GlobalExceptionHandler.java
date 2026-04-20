package com.ddip.backend.handler;

import com.ddip.backend.dto.exception.security.CustomAccessDeniedException;
import com.ddip.backend.dto.exception.ErrorCode;
import com.ddip.backend.dto.exception.ErrorResponse;
import com.ddip.backend.dto.exception.security.CustomAuthenticationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationException(MethodArgumentNotValidException e) {
        log.info("MethodArgumentNotValidException", e);

        return build(ErrorCode.INVALID_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Object> handleNotReadableException(HttpMessageNotReadableException e) {
        log.info("HttpMessageNotReadableException", e);
        return build(ErrorCode.INVALID_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDeniedException(AccessDeniedException e) {

        log.info("AccessDeniedException", e);

        if (e instanceof CustomAccessDeniedException custom) {
            return build(custom.getErrorCode());
        }

        return build(ErrorCode.FORBIDDEN);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Object> buildErrorResponseException(AuthenticationException e) {

        log.info("AuthenticationException", e);

        if (e instanceof CustomAuthenticationException custom) {
            return build(custom.getErrorCode());
        }

        return build(ErrorCode.UNAUTHORIZED);
    }

    private ResponseEntity<Object> build(ErrorCode errorCode) {
        ErrorResponse body = new ErrorResponse(errorCode);

        return ResponseEntity.status(errorCode.httpStatus).body(body);
    }

}