package com.ddip.backend.dto.crowd;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PledgeCreateRequestDto {

    // 추가 후원(선택) - null이면 0으로 처리
    @Min(0)
    private Long donateAmount;

    private List<PledgeItemRequestDto> items;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PledgeItemRequestDto {

        @NotNull
        private Long rewardTierId;

        @NotNull
        @Min(1)
        private Integer quantity;
    }
}