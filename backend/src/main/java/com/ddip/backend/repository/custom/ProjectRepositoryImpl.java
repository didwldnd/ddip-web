package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.QProject;
import com.ddip.backend.entity.QRewardTier;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@RequiredArgsConstructor
public class ProjectRepositoryImpl implements ProjectCustomRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public Optional<Project> findByIdWithRewardTiers(Long projectId) {
        Project result = queryFactory
                .selectFrom(QProject.project)
                .leftJoin(QProject.project.rewardTiers, QRewardTier.rewardTier).fetchJoin()
                .where(QProject.project.id.eq(projectId))
                .distinct()
                .fetchOne();

        return Optional.ofNullable(result);
    }
}
