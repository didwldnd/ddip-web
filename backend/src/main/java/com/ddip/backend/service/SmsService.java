package com.ddip.backend.service;

import com.ddip.backend.dto.user.MessageDto;
import com.ddip.backend.dto.user.UserResponseDto;
import com.solapi.sdk.message.exception.SolapiMessageNotReceivedException;
import com.solapi.sdk.message.model.Message;
import com.solapi.sdk.message.service.DefaultMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SmsService {

    private final DefaultMessageService messageService;

    @Value("${solapi.from}")
    private String from;

    public void sendSms(UserResponseDto dto, String password) {

        MessageDto messageDto = MessageDto.from(dto, password);

        Message message = new Message();
        message.setFrom(from);
        message.setTo(dto.getPhoneNumber());
        message.setText(messageDto.getMessage());
        try {
            messageService.send(message);
        } catch (SolapiMessageNotReceivedException e) {
            throw new IllegalStateException("SMS 발송 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new IllegalStateException("SMS 발송 중 예외: " + e.getMessage(), e);
        }
    }
}
