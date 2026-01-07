package com.ddip.backend.dto.error.security;

import com.ddip.backend.dto.error.ErrorCode;

public class ProfileIncompleteDeniedException extends CustomAccessDeniedException {
    public ProfileIncompleteDeniedException(String detail) {
        super("PROFILE_INCOMPLETE", ErrorCode.PROFILE_INCOMPLETE, detail);
    }
}
