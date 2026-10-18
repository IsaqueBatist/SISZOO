package com.siszoo.processos.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.DesfechoAnimal;

public interface DesfechoAnimalRepository extends JpaRepository<DesfechoAnimal, UUID> {

    List<DesfechoAnimal> findByAtivoTrueOrderByNomeAsc();

    Optional<DesfechoAnimal> findByCodigo(String codigo);
}
