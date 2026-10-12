package com.siszoo.ocorrencias.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.ocorrencias.entity.AnexoOcorrencia;

// So metadados: nenhuma consulta daqui toca anexo_ocorrencia_conteudo (D9).
public interface AnexoOcorrenciaRepository extends JpaRepository<AnexoOcorrencia, UUID> {

    List<AnexoOcorrencia> findByOcorrenciaIdOrderByCriadoEmAsc(UUID ocorrenciaId);

    long countByOcorrenciaId(UUID ocorrenciaId);

    Optional<AnexoOcorrencia> findByIdAndOcorrenciaId(UUID id, UUID ocorrenciaId);
}
