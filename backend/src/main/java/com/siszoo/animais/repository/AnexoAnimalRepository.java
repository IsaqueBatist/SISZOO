package com.siszoo.animais.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.entity.AnexoAnimal;

// So metadados: nenhuma consulta daqui toca anexo_animal_conteudo (D9).
public interface AnexoAnimalRepository extends JpaRepository<AnexoAnimal, UUID> {

    @EntityGraph(attributePaths = {"criadoPor"})
    List<AnexoAnimal> findByAnimalIdOrderByCriadoEmAsc(UUID animalId);

    long countByAnimalId(UUID animalId);

    Optional<AnexoAnimal> findByIdAndAnimalId(UUID id, UUID animalId);
}
