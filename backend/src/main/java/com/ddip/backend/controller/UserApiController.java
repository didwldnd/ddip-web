package com.ddip.backend.controller;

import com.ddip.backend.dto.user.*;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.service.SmsService;
import com.ddip.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserApiController {

    private final UserService userService;
    private final SmsService smsService;

    /**
     * 회원가입
     */
    @PostMapping
    public ResponseEntity<?> registerUser(@RequestBody UserRequestDto userRequest) {
        UserResponseDto userResponse = userService.createUser(userRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(userResponse);
    }

    /**
     * 회원정보 수정
     */
    @PostMapping("/edit")
    public ResponseEntity<?> updateUser(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                        @RequestBody UserUpdateRequestDto userUpdateReq) {

        userService.updateUser(customUserDetails.getUserId(), userUpdateReq);
        UserResponseDto updatedUser = userService.getUser(customUserDetails.getUserId());

        return ResponseEntity.ok(updatedUser);
    }

    /**
     * 회원 삭제
     */
    @DeleteMapping
    public ResponseEntity<String> deleteUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        userService.deleteUser(userDetails.getUserId());

        return ResponseEntity.ok("User Deleted Successfully" + userDetails.getUserId());
    }

    /**
     * 비밀번호 찾기
     */
    @PostMapping("/find-password")
    public ResponseEntity<Object> resetPassword(@RequestBody FindPasswordRequestDto dto) {

        UserResponseDto userResponse = userService.findUserForPasswordReset(dto);
        String temporaryPassword = PasswordGenerator.generatePassword(10);
        userService.updatePassword(userResponse.getId(), temporaryPassword);
        smsService.sendSms(userResponse, temporaryPassword);
        FindPasswordResponse response = new FindPasswordResponse("임시 비밀번호는" + temporaryPassword + "입니다.");

        return ResponseEntity.ok(response);
    }
}
