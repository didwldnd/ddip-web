package com.ddip.backend.controller;

import com.ddip.backend.dto.crowd.*;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.service.CrowdFundingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/crowd")
@RequiredArgsConstructor
public class CrowdFundingController {

    private final CrowdFundingService crowdFundingService;
//    private final PledgeService pledgeService;

    @PostMapping
    public ResponseEntity<?> createCrowdFunding(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                @Valid @RequestBody ProjectRequestDto projectRequestDto) {
        Long userId = customUserDetails.getUserId();
        long projectId = crowdFundingService.createProject(projectRequestDto, userId);
        return ResponseEntity.ok(projectId);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponseDto> getCrowdFunding(@PathVariable Long projectId ){
        ProjectResponseDto response = crowdFundingService.getProject(projectId);
        return ResponseEntity.ok(response);
    }

//    @PatchMapping("/{projectId}")
//    public ResponseEntity<?> updateCrowdFunding( @AuthenticationPrincipal CustomUserDetails customUserDetails,
//                                                    @PathVariable Long projectId,
//                                                    @Valid @RequestBody ProjectUpdateRequestDto requestDto) {
//        Long userId = customUserDetails.getUserId();
//        crowdFundingService.updateProject(projectId, userId, requestDto);
//        return ResponseEntity.ok().build();
//    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteCrowdFunding(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                   @PathVariable Long projectId) {
        Long userId = customUserDetails.getUserId();
        crowdFundingService.deleteProject(projectId, userId);
        return ResponseEntity.ok().build();
    }

//    @PostMapping("/{projectId}/pledges")
//    public ResponseEntity<PledgeResponseDto> createPledge(@AuthenticationPrincipal CustomUserDetails customUserDetails,
//                                                          @PathVariable Long projectId,
//                                                          @Valid @RequestBody PledgeCreateRequestDto requestDto) {
//        Long userId = customUserDetails.getUserId();
//        PledgeResponseDto responseDto = pledgeService.createPledge(userId, projectId, requestDto);
//    }

}
