package com.ddip.backend.repository;

import com.ddip.backend.entity.RewardTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RewardTierRepository extends JpaRepository<RewardTier, Long> {
}
