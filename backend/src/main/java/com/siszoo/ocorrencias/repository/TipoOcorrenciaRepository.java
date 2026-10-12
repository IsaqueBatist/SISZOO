package com.siszoo.ocorrencias.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.ocorrencias.entity.TipoOcorrencia;

public interface TipoOcorrenciaRepository extends JpaRepository<TipoOcorrencia, UUID> {

    Optional<TipoOcorrencia> findByCodigo(String codigo);

    List<TipoOcorrencia> findByAtivoTrueOrderByNomeAsc();
}
