package com.siszoo.ocorrencias.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.ocorrencias.entity.AnexoOcorrenciaConteudo;

// Unico caminho ate o bytea do anexo; usado so no upload e no download (D9).
public interface AnexoOcorrenciaConteudoRepository extends JpaRepository<AnexoOcorrenciaConteudo, UUID> {
}
