package com.siszoo.processos.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.ResultadoLaboratorial;

public interface ResultadoLaboratorialRepository extends JpaRepository<ResultadoLaboratorial, UUID> {

    Optional<ResultadoLaboratorial> findByCodigo(String codigo);

    List<ResultadoLaboratorial> findByAtivoTrueOrderByNomeAsc();
}
