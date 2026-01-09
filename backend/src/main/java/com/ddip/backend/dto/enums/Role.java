package com.ddip.backend.dto.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Role {
    USER("ROLE_USER", 0),
    ADMIN("ROLE_ADMIN", 100);

    private final String value;
    private final int level; // 숫자 권한 레벨 추가

}