//package com.ddip.backend.service;
//
//import com.ddip.backend.dto.crowd.PledgeCreateRequestDto;
//import com.ddip.backend.dto.crowd.PledgeResponseDto;
//import com.ddip.backend.dto.enums.ProjectStatus;
//import com.ddip.backend.entity.Project;
//import com.ddip.backend.entity.RewardTier;
//import com.ddip.backend.entity.User;
//import com.ddip.backend.repository.PledgeRepository;
//import com.ddip.backend.repository.ProjectRepository;
//import com.ddip.backend.repository.RewardTierRepository;
//import com.ddip.backend.repository.UserRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDateTime;
//
//@Slf4j
//@Service
//@Transactional
//@RequiredArgsConstructor
//public class PledgeService {
//
//    private final PledgeRepository pledgeRepository;
//    private final UserRepository userRepository;
//    private final ProjectRepository projectRepository;
//    private final RewardTierRepository rewardTierRepository;
//
//    public PledgeResponseDto createPledge(Long userId, Long projectId, PledgeCreateRequestDto requestDto) {
//        User user = userRepository.findById(userId)
//                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
//
//        Project project = projectRepository.findById(projectId)
//                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
//
//        if (project.getStatus() != ProjectStatus.OPEN) {
//            throw new IllegalStateException("현재 펀딩이 열려있지 않습니다.");
//        }
//
//        LocalDateTime now = LocalDateTime.now();
//        if (project.getStartAt() != null && now.isBefore(project.getStartAt())) {
//            throw new IllegalStateException("펀딩 시작 전입니다.");
//        }
//        if (project.getEndAt() != null && now.isAfter(project.getEndAt())) {
//            throw new IllegalStateException("펀딩이 종료되었습니다.");
//        }
//
//        if (requestDto.getRewardTierId() != null) {
//            RewardTier rewardTier = rewardTierRepository.findByIdForUpdate(requestDto.getRewardTierId())
//                    .orElseThrow(() -> new IllegalArgumentException("RewardTier not found: " + requestDto.getRewardTierId()));
//
//            // 이 티어가 해당 프로젝트 소속인지 검증
//            if (!rewardTier.getProject().getId().equals(project.getId())) {
//                throw new IllegalArgumentException("해당 프로젝트의 리워드가 아닙니다.");
//            }
//
//            // 수량 체크 + 판매수량 증가
//            rewardTier.increaseSoldQuantity();
//            // 금액은 서버가 티어 가격으로 결정
//            amount = rewardTier.getPrice();
//        } else {
//            // 리워드 없이 후원하는 경우(원하지 않으면 여기서 예외로 막으면 됨)
//            if (requestDto.getAmount() == null || requestDto.getAmount() < 1) {
//                throw new IllegalArgumentException("후원 금액은 1 이상이어야 합니다.");
//            }
//            amount = requestDto.getAmount();
//        }
//
//    }
//
//}
