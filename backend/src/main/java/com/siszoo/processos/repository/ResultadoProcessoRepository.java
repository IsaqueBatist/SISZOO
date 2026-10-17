package com.siszoo.processos.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.ResultadoProcesso;

// Resultado e imutavel (T34): so finders declarados aqui. O banco recusa
// UPDATE e DELETE (trigger da V14).
public interface ResultadoProcessoRepository extends JpaRepository<ResultadoProcesso, UUID> {

    // Historico do processo numa consulta; a ordem da cadeia de correcoes e
    // montada pelo service a partir de retifica.
    @EntityGraph(attributePaths = {"resultadoLaboratorial", "registradoPor", "retifica"})
    List<ResultadoProcesso> findByProcessoId(UUID processoId);

    boolean existsByRetificaId(UUID retificaId);
}
