package com.siszoo.ocorrencias.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.ocorrencias.entity.MovimentacaoOcorrencia;

public interface MovimentacaoOcorrenciaRepository extends JpaRepository<MovimentacaoOcorrencia, UUID> {

    @EntityGraph(attributePaths = {"usuario"})
    List<MovimentacaoOcorrencia> findByOcorrenciaIdOrderByDataDescCriadoEmDesc(UUID ocorrenciaId);
}
