package com.ddip.backend.dto.error.security;

import com.ddip.backend.dto.error.ErrorCode;

public class TokenExpiredException extends CustomAuthenticationException {
    public TokenExpiredException(String detail) {
        super("TOKEN_EXPIRED", ErrorCode.TOKEN_EXPIRED, detail);
    }
}
