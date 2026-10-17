package com.siszoo.processos.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.ResponsavelProcesso;

public interface ResponsavelProcessoRepository extends JpaRepository<ResponsavelProcesso, UUID> {

    Optional<ResponsavelProcesso> findByProcessoId(UUID processoId);
}
