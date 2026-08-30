package com.siszoo.animais.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.entity.StatusAnimal;

public interface StatusAnimalRepository extends JpaRepository<StatusAnimal, UUID> {

    Optional<StatusAnimal> findByCodigo(String codigo);
}
