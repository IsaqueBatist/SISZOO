package com.siszoo.animais.clinico.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.clinico.entity.Vacina;

public interface VacinaRepository extends JpaRepository<Vacina, UUID> {

    Optional<Vacina> findByCodigo(String codigo);
}
