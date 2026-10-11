package com.siszoo.ocorrencias.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.ocorrencias.entity.Denunciante;

public interface DenuncianteRepository extends JpaRepository<Denunciante, UUID> {

    Optional<Denunciante> findByOcorrenciaId(UUID ocorrenciaId);

    // Uma consulta por pagina da listagem, em vez de uma por ocorrencia.
    List<Denunciante> findByOcorrenciaIdIn(Collection<UUID> ocorrenciaIds);
}
