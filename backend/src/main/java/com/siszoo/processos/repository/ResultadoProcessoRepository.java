package com.siszoo.processos.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.ResultadoProcesso;

public interface ResultadoProcessoRepository extends JpaRepository<ResultadoProcesso, UUID> {

    @EntityGraph(attributePaths = {"resultadoLaboratorial", "registradoPor", "retifica"})
    List<ResultadoProcesso> findByProcessoId(UUID processoId);

    boolean existsByRetificaId(UUID retificaId);
}
