package com.siszoo.ocorrencias.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.ocorrencias.entity.AnexoOcorrenciaConteudo;

public interface AnexoOcorrenciaConteudoRepository extends JpaRepository<AnexoOcorrenciaConteudo, UUID> {
}
