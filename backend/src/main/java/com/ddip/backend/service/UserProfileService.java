package com.ddip.backend.service;

import com.ddip.backend.dto.user.ProfileRequestDto;
import com.ddip.backend.dto.user.UserResponseDto;
import com.ddip.backend.entity.User;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserProfileService {

    private final UserRepository userRepository;

    @Transactional
    public UserResponseDto putProfile(Long id, ProfileRequestDto requestDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.updateProfile(requestDto);

        return UserResponseDto.from(user);
    }
}
