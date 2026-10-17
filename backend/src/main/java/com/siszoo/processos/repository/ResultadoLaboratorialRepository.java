package com.siszoo.processos.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.ResultadoLaboratorial;

public interface ResultadoLaboratorialRepository extends JpaRepository<ResultadoLaboratorial, UUID> {

    List<ResultadoLaboratorial> findByAtivoTrueOrderByNomeAsc();
}
