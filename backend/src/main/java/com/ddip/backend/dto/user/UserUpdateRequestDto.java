package com.ddip.backend.dto.user;

import com.ddip.backend.dto.enums.BankType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequestDto {
    private String email;
    private String password;
    private String username;
    private String nickname;
    private String phoneNumber;
    private String account;
    private String accountHolder;
    private BankType bankType;
}
