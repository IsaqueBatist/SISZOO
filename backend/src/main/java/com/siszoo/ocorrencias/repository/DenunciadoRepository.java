package com.siszoo.ocorrencias.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.ocorrencias.entity.Denunciado;

public interface DenunciadoRepository extends JpaRepository<Denunciado, UUID> {

    Optional<Denunciado> findByOcorrenciaId(UUID ocorrenciaId);
}
