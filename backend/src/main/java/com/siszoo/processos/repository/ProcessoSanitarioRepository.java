package com.siszoo.processos.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siszoo.processos.entity.ProcessoSanitario;

import jakarta.persistence.LockModeType;

public interface ProcessoSanitarioRepository extends JpaRepository<ProcessoSanitario, UUID> {

    Optional<ProcessoSanitario> findByOcorrenciaId(UUID ocorrenciaId);

    // Uma consulta por pagina da listagem de ocorrencias.
    List<ProcessoSanitario> findByOcorrenciaIdIn(Collection<UUID> ocorrenciaIds);

    // Travado sempre DEPOIS da ocorrencia (ordem global de locks, ver
    // OcorrenciaService.vincularProcesso).
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ProcessoSanitario p WHERE p.id = :id")
    Optional<ProcessoSanitario> findByIdForUpdate(@Param("id") UUID id);
}
