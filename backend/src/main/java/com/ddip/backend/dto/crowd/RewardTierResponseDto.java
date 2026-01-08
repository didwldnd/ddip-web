package com.ddip.backend.dto.crowd;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RewardTierResponseDto {

    private Long id;
    private String title;
    private String description;
    private Long price;
    private Integer limitQuantity;
    private Integer soldQuantity;
    private boolean soldOut;

}
