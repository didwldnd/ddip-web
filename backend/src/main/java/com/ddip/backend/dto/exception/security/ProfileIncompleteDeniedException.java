package com.ddip.backend.dto.exception.security;

import com.ddip.backend.dto.exception.ErrorCode;

public class ProfileIncompleteDeniedException extends CustomAccessDeniedException {
    public ProfileIncompleteDeniedException(String detail) {
        super(ErrorCode.PROFILE_INCOMPLETE, detail);
    }
}
