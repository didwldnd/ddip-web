package com.ddip.backend.dto.user;

import com.ddip.backend.dto.enums.BankType;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequestDto {

    private String email;
    private String password;
    private String username;
    private String nickname;
    private String phoneNumber;
    private String account;
    private String accountHolder;
    private BankType bankType;

}
