package com.ddip.backend.repository;

import com.ddip.backend.entity.Project;
import com.ddip.backend.repository.custom.ProjectCustomRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long>, ProjectCustomRepository {
    Optional<Project> findById(Long id);
}
