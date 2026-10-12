package com.siszoo.ocorrencias.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.ocorrencias.entity.ProvidenciaTomada;

public interface ProvidenciaTomadaRepository extends JpaRepository<ProvidenciaTomada, UUID> {

    Optional<ProvidenciaTomada> findByCodigo(String codigo);

    List<ProvidenciaTomada> findByAtivoTrueOrderByNomeAsc();
}
