package com.siszoo.animais.clinico.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.siszoo.animais.clinico.entity.Vacina;

public interface VacinaRepository extends JpaRepository<Vacina, UUID>, JpaSpecificationExecutor<Vacina> {

    Optional<Vacina> findByCodigo(String codigo);

    List<Vacina> findByAtivoTrueOrderByNomeAsc();
}
