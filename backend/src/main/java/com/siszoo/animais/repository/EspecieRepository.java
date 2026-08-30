package com.siszoo.animais.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.entity.Especie;

public interface EspecieRepository extends JpaRepository<Especie, UUID> {

    Optional<Especie> findByCodigo(String codigo);
}
