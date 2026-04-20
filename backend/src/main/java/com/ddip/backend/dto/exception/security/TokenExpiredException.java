package com.ddip.backend.dto.exception.security;

import com.ddip.backend.dto.exception.ErrorCode;

public class TokenExpiredException extends CustomAuthenticationException {
    public TokenExpiredException(String detail) {
        super(ErrorCode.EXPIRED_TOKEN, detail);
    }
}
